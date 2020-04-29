const path = require('path')

const libraryPath = path.resolve(__dirname, '../../src/')
const aliasPathsToResolve = [{ name: 'slate-operational-transform', path: libraryPath }]

module.exports = {
  webpack: (config, { defaultLoaders }) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [libraryPath],
      use: [defaultLoaders.babel],
    })

    /** Resolve aliases */
    aliasPathsToResolve.forEach(module => {
      config.resolve.alias[module.name] = module.path
    })

    return config
  },
}
