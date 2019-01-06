module.exports = {
  launch: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  server: {
    command: 'yarn test:serve',
    port: 4444,
    launchTimeout: 10000,
  },
}
