const { defineConfig } = require('@vue/cli-service')
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  
  // Production optimizations
  productionSourceMap: false,
  
  // PWA configuration for better performance
  pwa: {
    name: 'EUNOIA',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black'
    // Removed workbox configuration to fix build issues
  },
  
  // Configure webpack for optimization
  configureWebpack: config => {
    // Production optimizations
    if (process.env.NODE_ENV === 'production') {
      // Gzip compression
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        })
      )
      
      // Bundle analyzer (only when ANALYZE=true)
      if (process.env.ANALYZE) {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-report.html'
          })
        )
      }
      
      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              name: 'chunk-vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'initial'
            },
            common: {
              name: 'chunk-common',
              minChunks: 2,
              priority: 5,
              chunks: 'initial',
              reuseExistingChunk: true
            }
          }
        }
      }
    }
  },
  
  // Chain webpack for additional optimizations
  chainWebpack: config => {
    // Image optimization
    config.module
      .rule('images')
      .test(/\.(gif|png|jpe?g|svg)$/i)
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: {
          progressive: true,
          quality: 80
        },
        optipng: {
          enabled: false
        },
        pngquant: {
          quality: [0.65, 0.90],
          speed: 4
        },
        gifsicle: {
          interlaced: false
        },
        webp: {
          quality: 75
        }
      })
    
    // Preload important resources (only if plugin exists)
    if (config.plugins.has('preload')) {
      config.plugin('preload').tap(options => {
        options[0] = {
          rel: 'preload',
          include: 'initial',
          fileBlacklist: [/\.map$/, /hot-update\.js$/]
        }
        return options
      })
    }
    
    // Prefetch for better performance (only if plugin exists)
    if (config.plugins.has('prefetch')) {
      config.plugin('prefetch').tap(options => {
        options[0].fileBlacklist = options[0].fileBlacklist || []
        options[0].fileBlacklist.push(/\.map$/, /hot-update\.js$/)
        return options
      })
    }
  },
  
  // Development server configuration
  devServer: {
    port: 8080,
    host: 'localhost',
    https: false,
    open: true,
    compress: true,
    historyApiFallback: true,
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    },
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL?.replace('/api', '') || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // CSS optimization
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: false
    // Removed SCSS variables import to fix build issues
  }
})