import * as tokenize from 'glsl-tokenizer/string'
import { Nodes } from './parser.d'

export const parse = (
  source: string,
): {
  attributes: Nodes
  uniforms: Nodes
  varyings: Nodes
} => {
  const tokens = tokenize(source)
  const attributes: Nodes = []
  const uniforms: Nodes = []
  const varyings: Nodes = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    switch (token.type) {
      case 'keyword': {
        switch (token.data) {
          case 'in':
          case 'uniform':
          case 'out': {
            const node: { type: string; name: string } = {
              type: '',
              name: '',
            }
            forwarding: for (; ; i++) {
              const t = tokens[i]
              switch (t.type) {
                case 'keyword': {
                  node.type = t.data
                  break
                }
                case 'ident': {
                  node.name = t.data
                  break
                }
                case 'operator': {
                  if (t.data === ';') {
                    break forwarding
                  }
                  break
                }
              }
            }
            switch (token.data) {
              case 'in': {
                attributes.push(node)
                break
              }
              case 'uniform': {
                uniforms.push(node)
                break
              }
              case 'out': {
                varyings.push(node)
                break
              }
            }
            break
          }
        }
        break
      }
    }
  }
  return { attributes, uniforms, varyings }
}
