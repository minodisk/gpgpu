# gpgpu [![Codeship Pro][build]](https://app.codeship.com/projects/320617) [![npm version][npm]](https://www.npmjs.com/package/gpgpu) [![npm type definitions][types]](https://www.typescriptlang.org/) [![License][license]](./LICENSE)

GPGPU with WebGL 2.0 in browser native JavaScript and GLSL

## Usage

```js
import GPGPU from 'gpgpu'
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
console.log(gpgpu.exec([1, 3, 5], [2, 4, 6]))
// -> [[1.5, 4.5, 7.5], [5, 10, 15]]
```

## Installation

```sh
yarn add gpgpu
```

## API

### `GPGPU.create(): GPGPU`

Create `GPGPU` instance. A new `HTMLCanvasElement` is created internally.

- Throws exception when `WebGl2RenderingContext` isn't support in the browser.

### `GPGPU.createWithCanvas(canvas: HTMLCanvasElement): GPGPU`

Create `GPGPU` instance with `HTMLCanvasElement`.

- Throws exception when `WebGL2RenderingContext` isn't support in the browser.

### `new GPGPU(context: WebGL2RenderingContext): GPGPU`

Create `GPGPU` instance with `WebGL2RenderingContext`.

### `GPGPU#compile(source: string)`

Parse source code written in GLSL and ready buffers for `attributes`, `uniforms` and `varyings`.

### `GPGPU#bind(...uniforms: Array<boolean | number | Array<number>>)`

Binds uniform value.

### `GPGPU#exec(...attributes: Array<Array<number>>): Array<number>`

Execute GLSL program with `attributes` and returns feedback transformed results.

[build]: https://img.shields.io/codeship/cd489ed0-f3a4-0136-9313-4661328143ed/master.svg?style=flat-square
[license]: https://img.shields.io/github/license/minodisk/gpgpu.svg?style=flat-square
[npm]: https://img.shields.io/npm/v/gpgpu.svg?style=flat-square
[types]: https://img.shields.io/npm/types/gpgpu.svg?style=flat-square
