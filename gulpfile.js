var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var compass = require('gulp-compass');
var mainBowerFiles=require('main-bower-files');
var filter = require('gulp-filter');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var gulp = require('gulp');
var debug = require('gulp-debug');
var jsonminify = require('gulp-jsonminify');
var wiredep= require ('gulp-wiredep');
var flatten = require('gulp-flatten');

var config = { 
    bowerDir: 'bower_components/'
};

// Basic Gulp task syntax


// Development Tasks
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'dist',
      routes: {
      '/bower_components': 'bower_components'
    }
    }

  })
})

//JS

gulp.task('js', function() {
  	return gulp.src(mainBowerFiles(/* options */))
		.pipe(filter('**/*.js'))
		.pipe(gulp.dest('app/js/'));

});

// CSS user ef
gulp.task('css', function() {
	return gulp.src(mainBowerFiles(/* options */))
		.pipe(filter('*.css'))
    .pipe(debug({title: 'unicorn:'}))
		.pipe(concat('app/css/components.css'))
		.pipe(gulp.dest('app/css'));
});

gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;
  gulp.src('app/*.html')
  .pipe(debug({title:"wire dep"}))
    .pipe(wiredep({
      'ignorePath': '../'
    }))
    .pipe(gulp.dest('app'));
});


gulp.task('compass', function () {
    gulp.src('app/scss/style.scss')
        .pipe(compass({
                sass: 'app/scss/',
                css:  'app/css/',
                image: '../images',
                style: 'expanded',
                require: ['susy', 'breakpoint']
            }))
            .on('error', gutil.log)
        //.pipe(gulp.dest( outputDir + 'css'))
        .pipe(browserSync.reload({ // Reloading with Browser Sync
          stream: true
        }))
      })





// Watchers
gulp.task('watch', function() {
  gulp.watch('app/scss/**/*.scss', ['compass']);
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/js/**/*.js', browserSync.reload);
  gulp.watch('app/js/*.json', browserSync.reload);
})

// Optimization Tasks
// ------------------

// Optimizing CSS and JavaScript
gulp.task('useref', function() {
  return gulp.src('app/*.html')
    .pipe(useref({
      'searchPath':['./', 'bower_components/*','./app/']
    }))
    .pipe(gulpIf('*.js', uglify()))
  //  .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist'));
});

// Optimizing Images
gulp.task('images', function() {
  return gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin

    .pipe(debug({title: 'unicorn:'}))
    .pipe(gulp.dest('dist/images'))
});

// Copying user fonts
gulp.task('fonts', function() {
  return gulp.src(['app/fonts/**/*'])
    .pipe(gulp.dest('dist/fonts'))
})
//icons
gulp.task('icons', function () { 
    return gulp.src('bower_components/*/fonts/*.{ttf,woff,eof,svg}') 
    .pipe(flatten())
    .pipe(debug({title: 'unicorn:'}))
        .pipe(gulp.dest('dist/fonts/')); 

});





// Copyinh and minimizing JSON
gulp.task('jsonCopy', function() {
  return gulp.src('app/js/*.json')
    .pipe(jsonminify())
    .pipe(gulp.dest('dist/js/'))
}),
gulp.task('kcssCopy', function() {
  return gulp.src('app/css/kaltura-custom.css')
    .pipe(gulp.dest('dist/css/'))
}),
gulp.task('kjsCopy', function() {
  return gulp.src('app/js/kaltura-custom.js')
    .pipe(gulp.dest('dist/js/'))
}),

// Cleaning
gulp.task('clean', function() {
  return del.sync('dist').then(function(cb) {
    return cache.clearAll(cb);
  });
})

gulp.task('clean:dist', function() {
  return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function(callback) {
  runSequence(['compass','browserSync','watch'],
    callback
  )
})

gulp.task('build', function(callback) {
  runSequence(
    'clean:dist',
    ['compass','jsonCopy','kcssCopy','kjsCopy', 'useref', 'images', 'icons','fonts'],
    callback
  )
})
