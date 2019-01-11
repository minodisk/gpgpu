import * as assert from 'assert'

describe(`GPGPU`, () => {
  beforeAll(() => {
    page.on('console', async msg => {
      // tslint:disable-next-line:no-console
      console.log(
        ...(await Promise.all(
          msg.args().map(async arg => await arg.jsonValue()),
        )),
      )
    })
  })

  beforeEach(async () => {
    await page.goto('http://localhost:4444', { waitUntil: 'load' })
  })

  describe('exec', () => {
    ;[
      {
        name: `nothing`,
        code: `
          float res1;
          void main(void){
            res1 = 123.0 * 5.0;
          }
          `,
        uniforms: [],
        attributes: [],
        expected: [],
      },
      {
        name: `int: 1 out`,
        code: `
          flat out int out1;
          void main(void){
            out1 = 3 * 4;
          }
          `,
        uniforms: [],
        attributes: [],
        expected: [[12]],
      },
      {
        name: `1 varying`,
        code: `
          out float res1;
          void main(void){
            res1 = 1.1 * 5.3;
          }
          `,
        uniforms: [],
        attributes: [],
        expected: [[5.830000400543213]],
      },
      {
        name: `1 attribute, 1 varying`,
        code: `
          in float in1;
          out float out1;
          void main(void){
            out1 = 2.4 + in1;
          }
          `,
        uniforms: [],
        attributes: [[2.6]],
        expected: [[5]],
      },
      {
        name: `2 attributes, 1 varying`,
        code: `
          in float in1;
          in float in2;
          out float out1;
          void main(void){
            out1 = in1 + in2;
          }
          `,
        uniforms: [],
        attributes: [[1.2, 2.4, 3.6], [1.8, 2.6, 3.4]],
        expected: [[3, 5, 7]],
      },
      {
        name: `2 uniforms, 2 attributes, 2 varyings`,
        code: `
          in float in1;
          in float in2;
          uniform float uni1;
          uniform float uni2;
          out float res1;
          out float res2;
          void main(void){
            res1 = in1 * uni1;
            res2 = in2 * uni2;
          }
          `,
        uniforms: [1.5, 2.5],
        attributes: [[1, 3, 5], [2, 4, 6]],
        expected: [[1.5, 4.5, 7.5], [5, 10, 15]],
      },
    ].forEach(c => {
      it(c.name, async () => {
        const handle = await page.evaluateHandle(
          (code, uniforms, attributes) => {
            const {
              gpgpu: { default: GPGPU },
            } = window
            const gpgpu = GPGPU.create()
            gpgpu.compile(`#version 300 es
        ${code}`)
            if (uniforms.length) {
              gpgpu.bind(...uniforms)
            }
            return { res: gpgpu.exec(...attributes) }
          },
          c.code,
          c.uniforms,
          c.attributes,
        )
        const props = await handle.getProperty('res')
        const actual = await props.jsonValue()
        // tslint:disable-next-line:no-console
        console.log(c.name, actual)
        assert.deepEqual(actual, c.expected)
      })
    })
  })
})
