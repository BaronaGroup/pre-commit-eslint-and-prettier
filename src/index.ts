if (process.argv.includes('--install') || process.argv.includes('--full-install')) {
  require('./install')
} else {
  require('./main')
}
