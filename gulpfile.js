'use strict';

var gulp 			= require('gulp');
var $ 				= require('gulp-load-plugins')({scope: ['devDependencies']});
var fs 				= require('fs');
var browserSync 	= require('browser-sync').create();
var yaml 			= require('yamljs');
var pngquant 		= require('imagemin-pngquant');
var argv 			= require('optimist').argv;
var cleanCSS 		= require('gulp-clean-css');
var map 			= require('map-stream');
var js 				= require('js-yaml');
var gutil 			= require("gulp-util");
var os 				= require('os');
var path 			= require('path');
var jsonSass 		= require('gulp-json-scss');
var sass 			= require('gulp-ruby-sass');



var destStyle 	= './build/styleguides/';
var destSite 	= './build/site/';



//Image Parameters
var sizePx 			= ['1440','1024','768','360'];
var suffix 			= ['l','m','s','xs'];
var isRetina 		= true;



//------------------------------------------------------------------------------
//SUMMARY-----------------------------------------------------------------------



// BrowserSync 							l. 60
// Compile JADE 						l. 96
// Compile SASS 						l. 177
// Compile Script 						l. 237
// YAML to JSON 						l. 271
// Eslint 								l. 302
// Copy Files 							l. 317
// Optimize Images 						l. 382
// Main Tasks 							l. 410



//------------------------------------------------------------------------------
//MAIN TASKS--------------------------------------------------------------------



// gulp 							-> default task to compile files
// gulp module --option [name] 		-> create new module
// gulp media 						-> Import media in ./build/
// gulp styleguides 				-> Generates Style Guides


// Alert : make sure you have launched gulp media one time before launching
// other tasks




//------------------------------------------------------------------------------
//create index.html for Minima--------------------------------------------------



gulp.task('minima', function(){
	gulp.src('src/minima.html')
	.pipe($.htmlmin({collapseWhitespace: true}))
	.pipe($.concat('index.html'))
	.pipe(gulp.dest('./build/'))
	.pipe(browserSync.stream());
});



//------------------------------------------------------------------------------
//BrowserSync-------------------------------------------------------------------



gulp.task('watch', function(gulpCallback) {
	var browser = browser === undefined ? 'google chrome' : browser;
	browserSync.init({
		server: './build/',
		open: true,
		browser: browser
	}, function callback() {
		gulp.watch('src/minima.html', ['minima']);
		gulp.watch('src/content/data/*.yml', ['pages', 's-frame', 's-pages', 'theme']);
		gulp.watch('src/modules/*/*.jade', ['pages', 's-frame', 's-pages']);
		gulp.watch('src/pages/*.jade', ['pages', 's-frame', 's-pages']);
		gulp.watch('src/*.jade', ['pages', 's-frame', 's-pages']);

		gulp.watch('src/modules/**/*.scss', ['sass','s-sass']);
		gulp.watch('src/styles/*.scss', ['sass','s-sass']);

		gulp.watch('src/content/fonts/*', ['fonts','s-fonts']);
		gulp.watch('src/content/icons/*', ['icons','s-icons']);
		gulp.watch('src/content/images/*',['images','s-images']);
		gulp.watch('src/content/video/*',['videos','s-videos']);
		gulp.watch('src/content/others/*',['others','s-others']);


		gulp.watch('src/js/*.js',['script', 's-script', 'eslint'], browserSync.reload);

		gulp.watch('src/modules/**/*.jade', browserSync.reload);
		gulp.watch('src/js/*.js', browserSync.reload);

		gulpCallback();
	});
});



//------------------------------------------------------------------------------
//JSON to SCSS------------------------------------------------------------------


gulp.task('themetojson', function() {
	gulp.src('src/content/data/_variables.yml')
	.pipe(map(function(file,cb){
		if (file.isNull()) return cb(null, file); // pass along
		if (file.isStream()) return cb(new Error("Streaming not supported"));

		var json;

		try {
			json = js.load(String(file.contents.toString('utf8')));
		} catch(e) {
			console.log(e);
			console.log(json);
		}

		file.path = gutil.replaceExtension(file.path, '.json');
		file.contents = new Buffer(JSON.stringify(json, null, 2));

		cb(null,file);
	}))
	.pipe(gulp.dest('src/styles/'));
});




gulp.task('themetoscss', function() {
	return gulp.src('src/styles/_variables.json')
	.pipe(jsonSass({sass: false}))
	.pipe($.concat('_variables.scss'))
	.pipe(gulp.dest('src/styles/'));
});




//Create new module from shell - gulp module --option [name]--------------------
//or create an alias - module [name]--------------------------------------------



gulp.task('module', function() {
	var option = process.argv[4];

	gulp.src('src/modules/default/*')
	.pipe($.template(argv))
	.pipe($.rename({basename: option}))
	.pipe(gulp.dest('./src/modules/'+option));
});



//------------------------------------------------------------------------------
//compile jade into html page---------------------------------------------------



gulp.task('pages', function(){
	gulp.src(['src/index.jade',
			  'src/pages/*.jade'])
	.pipe($.jadeGlobbing())
	.pipe($.data(function(file) {
		var files = fs.readdirSync('./src/content/data/');
		var jadeData = {};
		var i = 0;
		while(file = files[i++]) {
			var fileName = file.split('.')[0];
			jadeData[fileName] = yaml.load('./src/content/data/' + file);
		}
		return jadeData;
	}))
	.pipe($.jade())
	.pipe($.htmlmin({collapseWhitespace: true}))
	.pipe(gulp.dest(destSite))
	.pipe(browserSync.stream());
});



//------------------------------------------------------------------------------
//same function but STYLEGUIDES only--------------------------------------------



gulp.task('s-pages', function(){
	gulp.src('src/styleguides.jade')
	.pipe($.jadeGlobbing())
	.pipe($.data(function(file) {
		var files = fs.readdirSync('./src/content/data/');
		var jadeData = {};
		var i = 0;
		while(file = files[i++]) {
			var fileName = file.split('.')[0];
			jadeData[fileName] = yaml.load('./src/content/data/' + file);
		}
		return jadeData;
	}))
	.pipe($.jade())
	.pipe($.htmlmin({collapseWhitespace: true}))
	.pipe(gulp.dest(destStyle))
	.pipe(browserSync.stream());
});

gulp.task('s-frame', function(){
	gulp.src('src/styleguides-frame.jade')
	.pipe($.jadeGlobbing())
	.pipe($.data(function(file) {
		var files = fs.readdirSync('./src/content/data/');
		var jadeData = {};
		var i = 0;
		while(file = files[i++]) {
			var fileName = file.split('.')[0];
			jadeData[fileName] = yaml.load('./src/content/data/' + file);
		}
		return jadeData;
	}))
	.pipe($.jade())
	.pipe($.htmlmin({collapseWhitespace: true}))
	.pipe(gulp.dest(destStyle))
	.pipe(browserSync.stream());
});



//------------------------------------------------------------------------------
//sass--------------------------------------------------------------------------



gulp.task('sass', function() {
	return gulp.src(['src/styles/main.scss'])
	.pipe($.cssGlobbing({
		extensions: ['.scss']
	}))
	.pipe($.sass({
		includePaths: './src/content/data/',
		outputStyle: 'compressed'
	})
	.on('error', $.sass.logError))
	.on("error", $.notify.onError({
		message: 'You know sometimes, shit happens: <%= error.message %>'
	}))
	.pipe($.autoprefixer({
			cascade: false
	 }))
	.pipe(cleanCSS({
			compatibility: 'ie8'
	}))
	.pipe(gulp.dest(destSite))
	.pipe(browserSync.stream({match: '**/*.css'}));
});



//------------------------------------------------------------------------------
//sass for STYLEGUIDES----------------------------------------------------------



gulp.task('s-sass', function() {
	return gulp.src(['src/styles/styleguides.scss'])
	.pipe($.cssGlobbing({
		extensions: ['.scss']
	}))
	.pipe($.sass({
		includePaths: './src/content/data/',
		outputStyle: 'expanded'
	})
	.on('error', $.sass.logError))
	.on("error", $.notify.onError({
		message: 'You know sometimes, shit happens: <%= error.message %>'
	}))
	.pipe($.autoprefixer({
			cascade: true
	 }))
	.pipe(cleanCSS({
			compatibility: 'ie8'
	}))
	.pipe(gulp.dest(destStyle))
	.pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('copy-jui', function() {
	copyfiles('src/styles/jquery-ui.css','build/styleguides/');
});


//------------------------------------------------------------------------------
//scripts-----------------------------------------------------------------------



gulp.task('script', function() {
	return gulp.src(['src/js/jsonloader.js',
					 'src/js/chat.js',
					 'src/js/TextArea.js',
					 'src/js/chatUtils.js',
					 'src/js/main.js'])
	.pipe($.concat('main.js'))
	//.pipe($.uglify())
	.pipe(gulp.dest(destSite))
	.pipe(browserSync.stream());
});



//------------------------------------------------------------------------------
//scripts for STYLEGUIDES-------------------------------------------------------



gulp.task('s-script', function() {
	return gulp.src(['src/js/plugin.js',
					 'src/js/main.js',
					 'src/js/styleguides.js'])
	.pipe($.concat('main.js'))
	.pipe(gulp.dest(destStyle))
	.pipe(browserSync.stream());
});



//YAML to JSON------------------------------------------------------------------
//convert yaml to json----------------------------------------------------------



gulp.task('data', function() {
	gulp.src('src/content/data/*.yml')
	.pipe(map(function(file,cb){
		if (file.isNull()) return cb(null, file); // pass along
		if (file.isStream()) return cb(new Error("Streaming not supported"));

		var json;

		try {
			json = js.load(String(file.contents.toString('utf8')));
		} catch(e) {
			console.log(e);
			console.log(json);
		}

		file.path = gutil.replaceExtension(file.path, '.json');
		file.contents = new Buffer(JSON.stringify(json, null, 2));

		cb(null,file);
	}))
	.pipe(gulp.dest(destSite+'json/'));
});



//YAML to JSON------------------------------------------------------------------
//convert yaml to json for STYLEGUIDES------------------------------------------



gulp.task('s-data', function() {
	gulp.src('src/content/data/*.yml')
	.pipe(map(function(file,cb){
		if (file.isNull()) return cb(null, file); // pass along
		if (file.isStream()) return cb(new Error("Streaming not supported"));

		var json;

		try {
			json = js.load(String(file.contents.toString('utf8')));
		} catch(e) {
			console.log(e);
			console.log(json);
		}

		file.path = gutil.replaceExtension(file.path, '.json');
		file.contents = new Buffer(JSON.stringify(json, null, 2));

		cb(null,file);
	}))
	.pipe(gulp.dest(destStyle+'json/'));
});




//------------------------------------------------------------------------------
//eslint------------------------------------------------------------------------



gulp.task('eslint', function() {
	return gulp.src('src/js/*.js')
	.pipe($.eslint())
	.pipe($.eslint.format())
	.pipe($.eslint.failOnError());
});



//------------------------------------------------------------------------------
//Copy Files--------------------------------------------------------------------



function copyfiles(src, dest){
	return gulp.src(src)
	.pipe(gulp.dest(dest));
}


//------------------------------------------------------------------------------
//addons------------------------------------------------------------------------



gulp.task('s-addons', function() {
	copyfiles('src/addons/*','build/styleguides/addons');
});


gulp.task('addons', function() {
	copyfiles('src/addons/*','build/site/addons');
});



//------------------------------------------------------------------------------
//fonts-------------------------------------------------------------------------



gulp.task('s-fonts', function() {
	copyfiles('src/content/fonts/*/*','build/styleguides/fonts');
});


gulp.task('fonts', function() {
	copyfiles('src/content/fonts/*/*','build/site/fonts');
});



//------------------------------------------------------------------------------
//icons-------------------------------------------------------------------------



gulp.task('s-icons', function() {
	copyfiles('src/content/icons/*','build/styleguides/icons');
});


gulp.task('icons', function() {
	copyfiles('src/content/icons/*','build/site/icons');
});



//------------------------------------------------------------------------------
//others------------------------------------------------------------------------



gulp.task('s-others', function() {
	copyfiles('src/content/others/*','build/styleguides/others');
});


gulp.task('others', function() {
	copyfiles('src/content/others/*','build/site/others');
});



//------------------------------------------------------------------------------
//videos------------------------------------------------------------------------



gulp.task('s-videos', function() {
	copyfiles('src/content/videos/*','build/styleguides/videos');
});


gulp.task('videos', function() {
	copyfiles('src/content/videos/*','build/site/videos');
});



//------------------------------------------------------------------------------
//images-does not work with gif ... yet-----------------------------------------



gulp.task('images', function (){
	for(var i = 0; i < sizePx.length; i++){

		gulp.src('src/content/images/*')
		.pipe($.imageResize({width : sizePx[i], imageMagick : true}))
		.pipe($.imagemin({progressive: true, use: [pngquant()]}))
		.pipe($.rename({suffix: '-' + suffix[i]}))
		.pipe(gulp.dest('build/site/images/'))

		if(isRetina){
			gulp.src('src/content/images/*')
			.pipe($.imageResize({width : sizePx[i]*2, imageMagick : true}))
			.pipe($.imagemin({progressive: true, use: [pngquant()]}))
			.pipe($.rename({suffix: '-' + suffix[i] + '@2x'}))
			.pipe(gulp.dest('build/site/images/'))
		}

	}
});


gulp.task('s-images', function() {
	copyfiles('build/site/images/*','build/styleguides/images/');
});



//------------------------------------------------------------------------------
//Styleguides Tasks-------------------------------------------------------------



gulp.task('s-default', [
	'theme',
	's-data',
	's-frame',
	's-pages',
	's-sass',
	'copy-jui',
	's-script'
]);



//------------------------------------------------------------------------------
//Build Tasks-------------------------------------------------------------------



gulp.task('default', [
	'minima',
	's-default',
	'pages',
	'sass',
	'script',
	'eslint',
	'data',
	'watch'
]);



//------------------------------------------------------------------------------
//Import Medias-----------------------------------------------------------------



gulp.task('media', [
	's-media',
	'data',
	'addons',
	'images',
	'fonts',
	'icons',
	'videos',
	'others'
]);


gulp.task('s-media', [
	's-data',
	's-addons',
	's-images',
	's-fonts',
	's-icons',
	's-videos',
	's-others'
]);


//------------------------------------------------------------------------------
//Import Medias-----------------------------------------------------------------



gulp.task('theme', [
	//'themetojson',
	//'themetoscss'
]);
