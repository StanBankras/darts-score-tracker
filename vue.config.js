module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/darts-score-tracker/build/'
    : '/'
}