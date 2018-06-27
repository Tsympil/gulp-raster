const through = require('through2');
const gutil = require('gulp-util');
const rasterize = require('./lib/converter');
const PluginError = gutil.PluginError;
const phridge = require('phridge');

const PLUGIN_NAME = 'gulp-raster';

module.exports = function (opt) {
	'use strict';

	opt = opt || {};
	opt.scale = opt.scale || 1;
	opt.format = opt.format || 'png';
	opt.sizes = opt.sizes || false;
	opt.styles = opt.styles || '';

	const phantomProcess = phridge.spawn();

	return through.obj(function (file, enc, cb) {
		const that = this;

		// Do nothing if no contents
		if (file.isNull()) { return cb(); }

		if (file.isBuffer()) {
			rasterize(phantomProcess, file.contents.toString(), opt.format, opt.scale, opt.sizes, opt.styles, function (err, data) {
				if (err) { that.emit('error', new PluginError(PLUGIN_NAME, err)); }

				file.contents = data;
				that.push(file);
				return cb();
			});
		}
	}).on('end', function () {
		phantomProcess
			.then(phridge.disposeAll)
			.catch(function (err) {
				phridge.disposeAll();
				throw err;
			});
	});
};
