/*global webpage*/
'use strict';

module.exports = function rasterize(phantomProcess, svgContent, format, scale, sizes, styles,cb) {
	phantomProcess
		   .then(function (phantom) {
				return phantom.run(svgContent, format, scale, sizes, styles,
					function (svg, format, scale, sizes, styles, resolve) {
						var box;
						var content;
						var page = webpage.create();
						const setSizes = function (box, sizes) {
							const ratio = box.width / box.height;
							const changedSizes = {};

							if ((ratio >= 1 && sizes.width) || (sizes.width && !sizes.height)) {
								changedSizes['width'] = sizes.width;
								changedSizes['height'] = sizes.width / ratio;
							} else if ((ratio < 1 && sizes.height) || (!sizes.width && sizes.height)) {
								changedSizes['width'] = sizes.height * ratio;
								changedSizes['height'] = sizes.height;
							} else {
								changedSizes['width'] = box.width,
								changedSizes['height'] = box.height
							}

							const changeRatio = changedSizes.width / box.width;
							scale = changeRatio;

							Object.keys(box).forEach(function (key) {
								if (changedSizes[key]) {
									box[key] = changedSizes[key];
								} else {
									box[key] *= changeRatio;
								}
							});
						}


						if (styles.length) {
							content = '<style>' + styles.replace(/<\/?style>/g, '') + '</style>';
							content += svg;
						} else  {
							content = svg;
						}

						page.content = content;
						box = page.evaluate(function () {
							const svg = document.querySelector('svg');
							const bBox = svg.getBBox();

							svg.setAttribute('width', bBox.width);
							svg.setAttribute('height', bBox.height);

							return svg.getBoundingClientRect();
						});

						if (sizes) {
							setSizes(box, sizes);
						} else {
							Object.keys(box).forEach(function (key) {
								box[key] *= scale;
							});
						}

						page.clipRect = box;
						page.zoomFactor = scale;

						page.onLoadFinished = function() {
							resolve(page.renderBase64(format));
						};
					});
			})
			.then(function (img) {
				return cb(null, new Buffer(img.toString(), 'base64'));
			})
			.catch(function (err) {
				return cb(err);
			});
};
