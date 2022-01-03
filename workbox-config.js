module.exports = {
  /* [ONLY FOR generateSW] mode: 'development',*/
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{html,ico,json,css,js}',
    'src/images/*.{jpg,png}'
  ],
  globIgnores: [
    'help/**'
  ],
  injectionPoint: 'injectionPointTest',
  swSrc: 'public/sw-base.js',
  swDest: 'public/service-worker.js',
  /* [ONLY FOR generateSW] ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/
  ]*/
};