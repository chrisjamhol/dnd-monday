'use strict';

const
  gulp = require('gulp'),
  sass = require('gulp-sass'),
  sassGlob = require('gulp-sass-glob'),
  minify = require('gulp-uglifycss'),
  sourcemaps = require('gulp-sourcemaps')
;

//*************************************************************************************************
//
// Configuration
//
//*************************************************************************************************

const buildConfig = require('./build/config.json');

/*
 * Configure a Fractal instance.
 *
 * This configuration could also be done in a separate file, provided that this file
 * then imported the configured fractal instance from it to work with in your Gulp tasks.
 * i.e. const fractal = require('./my-fractal-config-file');
 */

const fractal = require('@frctl/fractal').create();
const mandelbrot = require('@frctl/mandelbrot');

const theme = mandelbrot({
  styles: [
    "default",
    "/css/styleguide.css"
  ],
  lang: "de"
});

fractal.set('project.title', buildConfig.name); // title for the project
fractal.web.set('builder.dest', `${__dirname}/public/`); // destination for the static export
fractal.web.set('static.path', __dirname + '/dist/');
fractal.web.theme(theme);
fractal.docs.set('path', `${__dirname}/source/docs`); // location of the documentation directory.
fractal.docs.set('statuses', buildConfig.status.docs);
fractal.components.set('path', `${__dirname}/source/components`); // location of the component directory.
fractal.components.set('default.preview', '@preview'); // set preview template name (_partial.hbs)
fractal.components.set('statuses', buildConfig.status.component);

const logger = fractal.cli.console; // keep a reference to the fractal CLI console utility


//*************************************************************************************************
//
// Fractal Tasks
//
//*************************************************************************************************

/*
 * Start the Fractal server
 *
 * In this example we are passing the option 'sync: true' which means that it will
 * use BrowserSync to watch for changes to the filesystem and refresh the browser automatically.
 * Obviously this is completely optional!
 *
 * This task will also log any errors to the console.
 */

gulp.task('fractal:start', function () {
  const server = fractal.web.server({sync: true});
  server.on('error', err => logger.error(err.message));
  return server.start().then(() => {
    logger.success(`Fractal server is now running at ${server.url}`);
  });
});

/*
 * Run a static export of the project web UI.
 *
 * This task will report on progress using the 'progress' event emitted by the
 * builder instance, and log any errors to the terminal.
 *
 * The build destination will be the directory specified in the 'builder.dest'
 * configuration option set above.
 */

gulp.task('fractal:build', function () {
  const builder = fractal.web.builder();
  builder.on('progress', (completed, total) => logger.update(`Exported ${completed} of ${total} items`, 'info'));
  builder.on('error', err => logger.error(err.message));
  return builder.build().then(() => {
    logger.success('Fractal build completed!');
  });
});

gulp.task('sass', function () {
  return gulp.src([buildConfig.paths.sass.sourcePath])
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('./'))
    .pipe(minify())
    .pipe(gulp.dest(buildConfig.paths.sass.dist))
    ;
});

gulp.task('watch', function () {
  gulp.watch(`${__dirname}/source/components/**/*.scss`, ['sass']);
  gulp.watch(`${__dirname}/source/scss/**/*.scss`, ['sass']);
  gulp.watch(`${__dirname}/source/styleguide/**/*.scss`, ['styleguide:sass']);
});

gulp.task('styleguide:sass', function () {
  return gulp.src([buildConfig.paths.sass.sourceStyleguidePath])
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('./'))
    .pipe(minify())
    .pipe(gulp.dest(buildConfig.paths.sass.dist))
    ;
});

gulp.task('fonts', function () {
  return gulp.src([buildConfig.paths.fonts.source])
    .pipe(gulp.dest(buildConfig.paths.fonts.dist))
  ;
});

/**
 * Build --> Static styleguide in public
 */
gulp.task(
  'build',
  [
    'sass',
    'styleguide:sass',
    'fonts',
    'fractal:build'
  ]
);

/**
 * Dist --> CSS/bb-Partials
 */
gulp.task(
  'dist',
  [
    'sass',
    'fonts'
  ]
);

/**
 * Serve --> Develop
 */
gulp.task(
  'serve',
  [
    'sass',
    'styleguide:sass',
    'fonts',
    'watch',
    'fractal:start'
  ]
);

gulp.task('default', ['serve']);