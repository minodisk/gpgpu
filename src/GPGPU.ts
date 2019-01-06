import { parse } from './parser'
import { WebGL2RenderingContext, WebGLTransformFeedback } from './GPGPU.d'

export class GPGPU {
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

  private static dummyFragmentShaderSource = `#version 300 es
precision highp float;
out vec4 color;
void main(){
  color = vec4(1.0);
}
`

  protected program: WebGLProgram
  protected attributes: Array<{ data: WebGLBuffer; location: GLint }> = []
  protected uniforms: Array<{
    data: WebGLBuffer
    location: WebGLUniformLocation
    type: string
  }> = []
  protected varyings: Array<{ feedback: WebGLBuffer }> = []
  protected transformFeedback?: WebGLTransformFeedback
  protected createVertexShader: (source: string) => WebGLShader
  protected createFragmentShader: (source: string) => WebGLShader

  constructor(protected gl: WebGL2RenderingContext) {
    this.createVertexShader = this.createShader(this.gl.VERTEX_SHADER)
    this.createFragmentShader = this.createShader(this.gl.FRAGMENT_SHADER)

    // setup program
    const program = this.gl.createProgram()
    if (program == undefined) {
      throw new Error(`program can not be created`)
    }
    this.program = program
  }

  public compile(source: string) {
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
      this.uniforms = uniforms.map(({ type, name }) => {
        const data = this.gl.createBuffer()
        if (data == undefined) {
          throw new Error('can not create buffer')
        }
        const location = this.gl.getUniformLocation(this.program, name)
        if (location == undefined) {
          throw new Error('can not get uniform location')
        }
        return { data, location, type }
      })
    }
    if (attributes != undefined) {
      this.attributes = attributes.map(({ name }) => {
        const data = this.gl.createBuffer()
        if (data == undefined) {
          throw new Error('can not create buffer')
        }
        const location = this.gl.getAttribLocation(this.program, name)
        this.gl.enableVertexAttribArray(location)
        this.gl.bindAttribLocation(this.program, location, name)
        return { data, location }
      })
    }
    if (varyings != undefined) {
      this.transformFeedback = this.gl.createTransformFeedback()
      this.varyings = varyings.map(() => {
        const feedback = this.gl.createBuffer()
        if (feedback == undefined) {
          throw new Error(`feedback buffer can not be created`)
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, feedback)
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          Float32Array.BYTES_PER_ELEMENT * 3,
          this.gl.STATIC_COPY,
        )
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
        return {
          feedback,
        }
      })
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
    this.uniforms.forEach(({ location, type }, i) => {
      const value = uniforms[i]
      switch (type) {
        case 'int':
        case 'bool':
          if (typeof value !== 'number') {
            throw new Error(`uniform ${value} at ${i} should be number`)
          }
          this.gl.uniform1i(location, value)
          break
        case 'float':
          if (typeof value !== 'number') {
            throw new Error(`uniform ${value} at ${i} should be number`)
          }
          this.gl.uniform1f(location, value)
          break
      }
    })
  }

  public exec(...attributes: Array<Array<number>>): Array<Float32Array> {
    this.gl.useProgram(this.program)

    if (attributes != undefined) {
      attributes.forEach((attribute, i) => {
        const { data, location } = this.attributes[i]
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, data)
        this.gl.vertexAttribPointer(location, 1, this.gl.FLOAT, false, 0, 0) // TODO: support vec2, vec3 or vec4
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new Float32Array(attribute),
          this.gl.STATIC_DRAW,
        )
      })
    }

    this.gl.enable(this.gl.RASTERIZER_DISCARD)

    if (this.transformFeedback != undefined) {
      this.gl.bindTransformFeedback(
        this.gl.TRANSFORM_FEEDBACK,
        this.transformFeedback,
      )
    }
    this.varyings.forEach(({ feedback }, i) => {
      this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, i, feedback)
    })

    this.gl.beginTransformFeedback(this.gl.POINTS)
    this.gl.drawArrays(this.gl.POINTS, 0, 3)
    this.gl.endTransformFeedback()

    this.gl.disable(this.gl.RASTERIZER_DISCARD)

    const res = this.varyings.map(({ feedback }, i) => {
      this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, i, null)

      const buf = new Float32Array(
        3,
        // new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT),
      )
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, feedback)
      this.gl.getBufferSubData(this.gl.ARRAY_BUFFER, 0, buf)
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)

      return Array.prototype.map.call(buf, (value: number) => value)
    })

    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null)
    this.gl.useProgram(null)

    return res
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
