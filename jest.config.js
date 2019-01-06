module.exports = {
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
      babelConfig: {
        presets: ['power-assert'],
      },
    },
    globals: {
      PATH: 'http://localhost:4444',
    },
  },
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.+(ts|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
}
