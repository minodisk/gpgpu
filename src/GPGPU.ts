import { WebGL2RenderingContext, WebGLTransformFeedback } from './GPGPU.d'
import { parse } from './parser'
import { Node } from './parser.d'

export interface Uniform extends Node {
  data: WebGLBuffer
  location: WebGLUniformLocation
  transform: any
}

export interface Attribute extends Node {
  buffer: WebGLBuffer
  location: GLint
  dim: number
  ArrayBuffer: any
}

export interface Varying extends Node {
  feedback: WebGLBuffer
  dim: number
  bytesPerElement: number
  ArrayBuffer: any
}

export default class GPGPU {
  public static create(): GPGPU {
    return GPGPU.createWithCanvas(document.createElement('canvas'))
  }

  public static createWithCanvas(canvas: HTMLCanvasElement): GPGPU {
    const context = canvas.getContext('webgl2', {
      antialias: false,
    }) as WebGL2RenderingContext
    if (context == undefined) {
      throw new Error('WebGL2 is not available')
    }
    return new GPGPU(context)
  }

  public static dim(type: string): number {
    const dim = GPGPU.dimMap[type]
    if (dim == undefined) {
      throw new Error(`dim for ${type} is not defined`)
    }
    return dim
  }

  private static dummyFragmentShaderSource = `#version 300 es
precision highp float;
out vec4 color;
void main(){
  color = vec4(1.0);
}
`
  private static dimMap = {
    int: 1,
    float: 1,
    vec2: 2,
    vec3: 3,
    vec4: 4,
  }

  private static bytesPerElementMap = {
    int: Int32Array.BYTES_PER_ELEMENT,
    float: Float32Array.BYTES_PER_ELEMENT,
    vec2: Float32Array.BYTES_PER_ELEMENT,
    vec3: Float32Array.BYTES_PER_ELEMENT,
    vec4: Float32Array.BYTES_PER_ELEMENT,
  }

  private static ArrayBufferMap = {
    int: Int32Array,
    float: Float32Array,
    vec2: Float32Array,
    vec3: Float32Array,
    vec4: Float32Array,
  }

  protected program: WebGLProgram
  protected uniforms: Array<Uniform> = []
  protected attributes: Array<Attribute> = []
  protected varyings: Array<Varying> = []
  protected transformFeedback?: WebGLTransformFeedback
  protected createVertexShader: (source: string) => WebGLShader
  protected createFragmentShader: (source: string) => WebGLShader
  protected uniformTransformMap: {
    int: (location: WebGLUniformLocation | null, x: GLint) => void
    vec2: (location: WebGLUniformLocation | null, v: Float32List) => void
    vec3: (location: WebGLUniformLocation | null, v: Float32List) => void
    vec4: (location: WebGLUniformLocation | null, v: Float32List) => void
  }

  constructor(protected gl: WebGL2RenderingContext) {
    this.createVertexShader = this.createShader(this.gl.VERTEX_SHADER)
    this.createFragmentShader = this.createShader(this.gl.FRAGMENT_SHADER)

    // setup program
    const program = this.gl.createProgram()
    if (program == undefined) {
      throw new Error(`program can not be created`)
    }
    this.program = program

    // uniform transform functions
    this.uniformTransformMap = {
      int: this.gl.uniform1i.bind(this.gl),
      vec2: this.gl.uniform2fv.bind(this.gl),
      vec3: this.gl.uniform3fv.bind(this.gl),
      vec4: this.gl.uniform4fv.bind(this.gl),
    }
  }

  public compile(source: string) {
    try {
      const { attributes, uniforms, varyings } = parse(source)

      // setup shaders
      const vertexShader = this.createVertexShader(source)
      const fragmentShader = this.createFragmentShader(
        GPGPU.dummyFragmentShaderSource,
      )
      this.gl.attachShader(this.program, vertexShader)
      this.gl.attachShader(this.program, fragmentShader)

      if (varyings != undefined) {
        this.gl.transformFeedbackVaryings(
          this.program,
          varyings.map(({ name }) => name),
          this.gl.SEPARATE_ATTRIBS,
        )
      }

      this.gl.linkProgram(this.program)
      const status = this.gl.getProgramParameter(
        this.program,
        this.gl.LINK_STATUS,
      )
      if (!status) {
        const info = this.gl.getProgramInfoLog(this.program)
        throw new Error(`program can not be linked${info ? ': ' + info : ''}`)
      }

      this.gl.deleteShader(vertexShader)
      this.gl.deleteShader(fragmentShader)

      // setup variables

      this.gl.useProgram(this.program)

      if (uniforms != undefined) {
        this.uniforms = uniforms.map(uniform => {
          const data = this.gl.createBuffer()
          if (data == undefined) {
            throw new Error('can not create buffer')
          }
          const location = this.gl.getUniformLocation(
            this.program,
            uniform.name,
          )
          if (location == undefined) {
            throw new Error('can not get uniform location')
          }
          return {
            ...uniform,
            data,
            location,
            transform: this.uniformTransformMap[uniform.type],
          }
        })
      }

      if (attributes != undefined) {
        this.attributes = attributes.map(attribute => {
          const buffer = this.gl.createBuffer()
          if (buffer == undefined) {
            throw new Error('can not create buffer')
          }
          const location = this.gl.getAttribLocation(
            this.program,
            attribute.name,
          )
          this.gl.enableVertexAttribArray(location)
          this.gl.bindAttribLocation(this.program, location, attribute.name)
          return {
            ...attribute,
            buffer,
            location,
            dim: GPGPU.dim(attribute.type),
            ArrayBuffer: GPGPU.ArrayBufferMap[attribute.type],
          }
        })
      }

      if (varyings != undefined) {
        this.transformFeedback = this.gl.createTransformFeedback()
        this.varyings = varyings.map(varying => {
          const feedback = this.gl.createBuffer()
          if (feedback == undefined) {
            throw new Error(`feedback buffer can not be created`)
          }
          const bytesPerElement = GPGPU.bytesPerElementMap[varying.type]
          if (bytesPerElement == undefined) {
            throw new Error(
              `bytes per element for varying ${varying.name}(${
                varying.type
              }) is not defined`,
            )
          }
          const ArrayBuffer = GPGPU.ArrayBufferMap[varying.type]
          if (ArrayBuffer == undefined) {
            throw new Error(
              `array buffer constructor for varying ${varying.name}(${
                varying.type
              }) is not defined`,
            )
          }
          return {
            ...varying,
            feedback,
            dim: GPGPU.dim(varying.type),
            bytesPerElement,
            ArrayBuffer,
          }
        })
      }

      this.gl.useProgram(null)
    } catch (err) {
      throw new Error(`compile error: ${err.toString()}`)
    }
  }

  public bind(...uniforms: Array<boolean | number | Array<number>>) {
    this.gl.useProgram(this.program)
    if (uniforms.length !== this.uniforms.length) {
      throw new Error(
        `the number of uniforms required ${
          this.uniforms.length
        }, but specified ${uniforms.length}`,
      )
    }
    this.uniforms.forEach(({ location, transform }, i) => {
      transform(location, uniforms[i])
    })
  }

  public exec(...attributes: Array<Array<number>>): Array<any> {
    try {
      let drawCount = 1

      // bind attributes
      this.attributes.forEach(({ buffer, location, dim, ArrayBuffer }, i) => {
        const attribute = attributes[i]
        drawCount = Math.max(drawCount, attribute.length)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
        this.gl.vertexAttribPointer(location, dim, this.gl.FLOAT, false, 0, 0) // TODO: support vec2, vec3 or vec4
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new ArrayBuffer(attribute.flat()),
          this.gl.STATIC_DRAW,
        )
      })

      // bind varyings
      this.varyings.forEach(({ feedback, dim, bytesPerElement }) => {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, feedback)
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          bytesPerElement * dim * drawCount,
          this.gl.STATIC_COPY,
        )
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
      })

      // bind transform feedback
      this.gl.useProgram(this.program)
      if (this.transformFeedback != undefined) {
        this.gl.bindTransformFeedback(
          this.gl.TRANSFORM_FEEDBACK,
          this.transformFeedback,
        )
      }
      this.varyings.forEach(({ feedback }, i) => {
        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, i, feedback)
      })

      // draw to buffer
      this.gl.enable(this.gl.RASTERIZER_DISCARD)
      this.gl.beginTransformFeedback(this.gl.POINTS)
      this.gl.drawArrays(this.gl.POINTS, 0, drawCount)
      this.gl.endTransformFeedback()
      this.gl.disable(this.gl.RASTERIZER_DISCARD)

      // unbind transform feedback
      if (this.transformFeedback != undefined) {
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null)
      }
      this.gl.useProgram(null)

      // capture varyings
      return this.varyings.map(
        ({ feedback, dim, bytesPerElement, ArrayBuffer }, i) => {
          this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, i, null)
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, feedback)
          const values = Array.from(new Array(drawCount)).map((_, j) => {
            const buf = new ArrayBuffer(dim)
            this.gl.getBufferSubData(
              this.gl.ARRAY_BUFFER,
              bytesPerElement * dim * j,
              buf,
            )
            return dim === 1
              ? buf[0]
              : Array.prototype.map.call(buf, (value: number) => value)
          })
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
          return values
        },
      )
    } catch (err) {
      throw new Error(`ExecError: ${err.toString()}`)
    }
  }

  protected createShader(type: GLenum): (source: string) => WebGLShader {
    const shader = this.gl.createShader(type)
    const name = {
      [this.gl.VERTEX_SHADER]: 'vertex',
      [this.gl.FRAGMENT_SHADER]: 'fragment',
    }[type]
    if (shader == undefined) {
      throw new Error(`${name} shader can not be created`)
    }
    return (source: string): WebGLShader => {
      this.gl.shaderSource(shader, source)
      this.gl.compileShader(shader)
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        throw new Error(
          `${name} shader can not be created: ${this.gl.getShaderInfoLog(
            shader,
          )}`,
        )
      }
      return shader
    }
  }
}
