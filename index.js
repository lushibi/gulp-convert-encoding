'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var iconv = require('iconv-lite');

var BOM = new Buffer('\uFEFF');
// Constants
var UTF8 = 'utf8';

module.exports = function (options) {
	options = options || {};

	if (!options.from && !options.to) {
		throw new gutil.PluginError('gulp-convert-encoding', 'At least one of `from` or `to` required');
	}

	options.from = options.from || UTF8;
	options.to = options.to || UTF8;
	options.iconv = options.iconv ? options.iconv :
		{ decode: {}, encode: {} };

	return through.obj(function (file, enc, cb) {

		if (file.isNull()) {
			this.push(file);
			cb();
			return;
		}

		var shouldIgnore = false;
		if (options.ignore && file.path) {
			var ignore = options.ignore;
			var fpath = file.path;
			if (!Array.isArray(ignore)) {
				ignore = [ignore];
			}
			for (var index = 0; index < ignore.length; index++) {
				var ignoreOne = ignore[index];
				if (ignoreOne.test(fpath)) {
					shouldIgnore = true;
					break;
				}
			}
		}

		if (file.isStream()) {
			try {
				if(!shouldIgnore)
					file.contents = file.contents
						.pipe(iconv.decodeStream(options.from, options.iconv.decode))
						.pipe(iconv.encodeStream(options.to, options.iconv.encode));
				this.push(file);
			} catch (err) {
				this.emit('error', new gutil.PluginError('gulp-convert-encoding', err));
			}
		}

		if (file.isBuffer()) {
			try {
				if(!shouldIgnore) {
					var content = iconv.decode(file.contents, options.from, options.iconv.decode);
					file.contents = iconv.encode(content, options.to, options.iconv.encode);
				}
				if (options.addBOM === true) {
					file.contents = Buffer.concat([BOM, file.contents])
				}
				this.push(file);
			} catch (err) {
				this.emit('error', new gutil.PluginError('gulp-convert-encoding', err));
			}
		}

		cb();
	});
};
