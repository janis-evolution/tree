// Karma configuration
// Generated on Tue Aug 11 2015 19:53:58 GMT+0300 (EEST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'build/jquery.js',
      'build/jquery_ujs.js',
      'build/handlebars.js',
      'app/assets/javascripts/libraries/uuid.core.js',
      'app/assets/javascripts/shared/core/Evolution.js',
      'app/assets/javascripts/shared/core/Evolution.db.js',
      'app/assets/javascripts/shared/core/Evolution.utils.js',
      'app/assets/javascripts/shared/core/Base.js',
      'app/assets/javascripts/core/Evolution.js',
      'app/assets/javascripts/shared/models/Node.js',
      'app/assets/javascripts/application.js',
      'test/node_unit_test.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
