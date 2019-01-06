import * as assert from 'assert'

describe(`GPGPU`, () => {
  beforeEach(async () => {
    await page.goto('http://localhost:4444', { waitUntil: 'load' })
  })

  describe('exec', () => {
    //     it(`no in, no uniform`, async () => {
    //       const handle = await page.evaluateHandle(() => {
    //         const { GPGPU } = window['gpgpu']
    //         const gpgpu = new GPGPU(document.createElement('canvas'))
    //         gpgpu.compile(`#version 300 es
    // out float res1;
    // void main(void){
    //   res1 = 123.0 * 5.0;
    // }`)
    //         return { res: gpgpu.exec() }
    //       })
    //       const props = await handle.getProperty('res')
    //       const actual = await props.jsonValue()
    //       console.log(actual)
    //       assert.deepEqual(actual, [[615]])
    //     })

    it(`multi in, multi uniform, multi out`, async () => {
      const handle = await page.evaluateHandle(() => {
        const { GPGPU } = window.gpgpu
        const gpgpu = GPGPU.create()
        gpgpu.compile(`#version 300 es
in float in1;
in float in2;
uniform float uni1;
uniform float uni2;
out float res1;
out float res2;
void main(void){
  res1 = in1 * uni1;
  res2 = in2 * uni2;
}`)
        gpgpu.bind(1.5, 2.5)
        return { res: gpgpu.exec([1, 3, 5], [2, 4, 6]) }
      })
      const props = await handle.getProperty('res')
      const actual = await props.jsonValue()
      assert.deepEqual(actual, [[1.5, 4.5, 7.5], [5, 10, 15]])
    })
  })
})
