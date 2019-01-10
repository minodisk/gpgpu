const path = require('path')
const express = require('express')
const webpack = require('webpack')
const middleware = require('webpack-dev-middleware')
const config = require(path.join(__dirname, 'webpack.config.js'))

config.output = {
  ...config.output,
  library: 'gpgpu',
  libraryTarget: 'umd',
}

const compiler = webpack(config)
const app = express()

function normalizeAssets(assets) {
  return Array.isArray(assets) ? assets : [assets]
}

app.use(middleware(compiler, { serverSideRender: true }))

app.use((req, res) => {
  const assetsByChunkName = res.locals.webpackStats.toJson().assetsByChunkName

  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Test for GPGPU</title>
  </head>
  <body>
    ${normalizeAssets(assetsByChunkName.main)
      .filter(path => path.endsWith('.js'))
      .map(path => `<script src="${path}"></script>`)
      .join('\n')}
  </body>
</html>`)
})

let port = 4444
const index = Math.max(
  process.argv.indexOf('--port'),
  process.argv.indexOf('-p'),
)
if (index !== -1) {
  port = +process.argv[index + 1] || port
}

app.listen(port)
console.log(`Server started at http://localhost:${port}/`)
