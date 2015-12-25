'use strict'


var SpectrumChart = (function(containerElementId, bands) {
	var version = '';
	var snap;
	var boundingBox = {
		x: 0,
		y: 0,
		width: 1024,
		height: 1024
	};

	function drawFullChart() {
		var height, spacing, i;

		var ranges = [
			[3 * Math.pow(10, 3), 300 * Math.pow(10, 3)],
			[300 * Math.pow(10, 3), 3 * Math.pow(10, 6)],

			[3 * Math.pow(10, 6), 30 * Math.pow(10, 6)],
			[30 * Math.pow(10, 6), 300 * Math.pow(10, 6)],

			[300 * Math.pow(10, 6), 3 * Math.pow(10, 9)],
			[3 * Math.pow(10, 9), 30 * Math.pow(10, 9)],
			[30 * Math.pow(10, 9), 300 * Math.pow(10, 9)]
		];

		spacing = 30;
		height = (boundingBox.height - (spacing * (ranges.length - 1))) / ranges.length;

		for (i = 0; i < ranges.length; i++) {

			var box = {
				x: boundingBox.x,
				y: (height + spacing) * i,
				width: boundingBox.width,
				height: height
			};
			drawChart(ranges[i], box);

		}
	};

	function getServiceAndColor(text) {
		var candidate = [''],
			i;

		text = text + '';

		for (i = 0; i < servicesAndColors.length; i++) {
			if (text.toLowerCase().startsWith(servicesAndColors[i][0].toLowerCase()) && servicesAndColors[i][0].length > candidate[0].length) {
				candidate = servicesAndColors[i];
			}
		}
		return (candidate[0] !== '' ? candidate : undefined);
	};

	function drawChart(range, boundingBox) {
		var i, j, width, height, offsetX = 0, offsetY, len, service, services;
		var logarithmic = false;

		snap.rect(
		boundingBox.x,
		boundingBox.y,
		boundingBox.width,
		boundingBox.height).attr({
			stroke: 'black',
			fill: 'white'
		});


		if (logarithmic) {
			len = Math.log10(range[1]) - Math.log10(range[0]);
		} else {
			len = range[1] - range[0];
		}

		for (i = 0; i < bands.length; i++) {
			if (bands[i].uf > range[0] && bands[i].lf < range[1]) {

				if (logarithmic) {
					lf = Math.log10(bands[i].lf);
					uf = Math.log10(bands[i].uf);

					if (lf === Infinity || lf === -Infinity) {
						lf = 0;
					}
					width = (boundingBox.width / len) * (uf - lf);
				} else {
					width = (boundingBox.width / len) * (bands[i].uf - bands[i].lf);
				}

				if (bands[i].services && bands[i].services.length > 0) {
					services = bands[i].services;
					offsetY = boundingBox.y;

					for (j = 0; j < services.length; j++) {
						height = boundingBox.height / services.length;
						drawServce(bands[i].services[j].desc, offsetX, offsetY, width, height);
						offsetY = offsetY + height;
					}

				} else {
					snap.rect(offsetX, boundingBox.y, width, boundingBox.height).attr({
						stroke: 'black',
						fill: 'blue'
					});
				}

				offsetX = offsetX + width;

			}
		}
	}

	function drawServce(service, x, y, width, height) {
		var rect, text, serviceAndColor;
		var fillColor = 'white';
		var serviceName = '';

		serviceAndColor = getServiceAndColor(service);

		if (serviceAndColor) {
			fillColor = serviceAndColor[1];
			serviceName = serviceAndColor[0];
			if (fillColor === undefined) {
			     console.log(serviceAndColor, fillColor, serviceName );
			}
		}

		rect = snap.rect(x, y, width, height).attr({
			stroke: 'black',
			fill: fillColor,
			strokeWidth: 1,
			'class': 'service ' + serviceName.replace(' ','')
		});

        text = snap.text(-200, -200, ' ' + serviceName + ' ');
        text.attr({
            x: rect.getBBox().x + (width / 2 - (text.getBBox().width / 2)),
            y: rect.getBBox().y + (height / 2 + (text.getBBox().height / 2)),
            'class': 'service'
        });

        if (text.getBBox().width > rect.getBBox().width) {
            var transform = '';
            if (rect.getBBox().width > rect.getBBox().height) {
                transform = 's' + (rect.getBBox().width / text.getBBox().width);
            } else {
                transform += 'r-90';

                if (text.getBBox().width > rect.getBBox().height) {
                    transform += ' s' + (text.getBBox().height / rect.getBBox().height);
                } else {
                    transform += ' s' + (rect.getBBox().width / text.getBBox().width);
                }
            }
            text.transform(transform);

        }


	}

	function init() {
		var svgRef = '#' + containerElementId;

		if ($(svgRef).type !== 'svg') {
			boundingBox.width = $(svgRef).width();
			boundingBox.height = $(svgRef).height();

			$(svgRef).html('<svg width="' + $(svgRef).width() + 'px" height="' + $(svgRef).height() + 'px"/>');
			svgRef = svgRef + ' svg';
		}

		snap = Snap(svgRef);
	}

	init();
	drawFullChart();
});


$(document).ready(function() {
    var i;

	$('#allocationChart').html('loading...');

	$('#legend').append('<ul></ul>');
	for (i=0; i<servicesAndColors.length; i++) {
        $('#legend ul').append(
            '<li class="key" id="' + servicesAndColors[i][0].replace(' ','') + '"><div class="colorbox" style="background: ' +
            servicesAndColors[i][1] + '"></div><div>' + servicesAndColors[i][0] + '</div></li>'
            );
	}

	$('li.key').on('mouseenter', function () {

	     Snap.selectAll('.service').forEach( function (element, b) {
	     	 element.addClass('rectHidden');
	     });

	     Snap.selectAll('text').forEach( function (element, b) {
	     	 element.addClass('rectHidden');
	     });

	     Snap.selectAll('.' + $(this).attr('id')).forEach( function (element, b) {
	     	 element.removeClass('rectHidden');
	     });

	     Snap.selectAll('.' + $(this).attr('id')).forEach( function (element, b) {
	     	 element.addClass('rectHighlight');
	     });

	});

	$('li.key').on('mouseleave', function () {

	     Snap.selectAll('.service').forEach( function (element, b) {
	     	 element.removeClass('rectHidden');
	     });

	     Snap.selectAll('.service').forEach( function (element, b) {
	     	 element.removeClass('rectHighlight');
	     });

	     Snap.selectAll('text').forEach( function (element, b) {
	     	 element.removeClass('rectHidden');
	     });
	});

    loadAvailableRegions('#regionSelector', function(region) {
        var url = baseRestPath + '/tables/' + region + '/index.json';
        $.getJSON(url, function(data) {

            $('.region').html(data.metadata.name_en);
         	$('#allocationChart').html('loading...');

            setTimeout(function() {
                var spectrumChart = SpectrumChart('allocationChart', data.tables[0].bands);
                }, 0);
        });
    });


});