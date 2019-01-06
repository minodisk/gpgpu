# gpgpu

GPGPU with WebGL 2.0 in browser native JavaScript and GLSL

## Usage

```js
const { GPGPU } = window['gpgpu']
const gpgpu = new GPGPU(document.createElement('canvas'))
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
console.log(gpgpu.exec([1, 3, 5], [2, 4, 6]))
// -> [[1.5, 4.5, 7.5], [5, 10, 15]]
```
