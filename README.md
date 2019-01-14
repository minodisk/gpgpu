# gpgpu [![Codeship Pro][build]](https://app.codeship.com/projects/320617) [![npm version][npm]](https://www.npmjs.com/package/gpgpu) [![npm type definitions][types]](https://www.typescriptlang.org/) [![License][license]](./LICENSE)

GPGPU with WebGL 2.0 in browser native JavaScript and GLSL

## Usage

### Import

```js
import * as GPGPU from 'gpgpu'
```

or

```js
const GPGPU = require('gpgpu')
```

### Execution

```js
const gpgpu = GPGPU.create(document.createElement('canvas'))
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
npm install --save gpgpu
```

or

```sh
yarn add gpgpu
```

## API

### Static

#### `GPGPU.create(canvas: HTMLCanvasElement): GPGPU`

Create `GPGPU` instance with `HTMLCanvasElement`.

- Throws exception when `WebGL2RenderingContext` isn't supported in the browser.

### Constructor

#### `new GPGPU(context: WebGL2RenderingContext): GPGPU`

Create `GPGPU` instance with `WebGL2RenderingContext`.

### Member

#### `compile(source: string)`

Parse GLSL program and ready buffers for `attributes`, `uniforms` and `varyings`.

#### `bind(...uniforms: Array<boolean | number | Array<number>>)`

Binds uniform values.

#### `exec(...attributes: Array<Array<number>>): Array<number>`

Execute GLSL program with `attributes` and returns transformed results.

## Types

|GLSL Type|JavaScript Type|
|:--|:--|
|`int`,`float`|`number`|
|`vec2`|`[number, number]`|
|`vec3`|`[number, number, number]`|
|`vec4`|`[number, number, number, number]`|

## Contribution

1. Fork ([https://github.com/minodisk/gpgpu/fork](https://github.com/minodisk/gpgpu/fork))
2. Create a feature branch
3. Commit your changes
4. Rebase your local changes against the master branch
5. Run test suite with the `yarn test` command and confirm that it passes
6. Run linter with the `yarn lint` command and confirm that it passes
7. Run formatter with the `yarn format:write` command
8. Create new Pull Request

[build]: https://img.shields.io/codeship/cd489ed0-f3a4-0136-9313-4661328143ed/master.svg?style=flat-square
[license]: https://img.shields.io/github/license/minodisk/gpgpu.svg?style=flat-square
[npm]: https://img.shields.io/npm/v/gpgpu.svg?style=flat-square
[types]: https://img.shields.io/npm/types/gpgpu.svg?style=flat-square
