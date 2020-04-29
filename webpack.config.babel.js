import { resolve } from 'path'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import nodeExternals from 'webpack-node-externals'

import Blurt from './package.json'

// const ES = 'es'
// const CJS = 'commonjs2'
const UMD = 'umd2'

const configure = target => {
  return {
    mode: 'production',
    devtool: 'source-map',
    entry: {
      index: resolve(__dirname, `./src/index.ts`),
    },
    output: {
      path: resolve(__dirname, `./dist`),
      filename: '[name].js',
      chunkFilename: '[name].[id].js',
      libraryTarget: target,
      library: 'slate-operational-transform',
    },
    externals: [nodeExternals()],
    module: {
      rules: [
        // {
        //   test: /\.tsx?$/,
        //   loader: 'ts-loader',
        //   options: {
        //     transpileOnly: false,
        //   },
        // },
        {
          test: /\.(ts|js)x?$/, // Include ts, tsx, js, and jsx files
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3,
                },
              ],
              '@babel/preset-typescript',
              '@babel/preset-react',
            ],
          },
        },
      ],
    },
    plugins: [new CleanWebpackPlugin()],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: resolve(__dirname, `./tsconfig.json`),
        }),
      ],
    },
  }
}

export default configure(UMD)
