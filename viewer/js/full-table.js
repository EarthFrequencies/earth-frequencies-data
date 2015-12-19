'use strict'

var baseRestPath = '../rest';

function hzToHuman(value, fixedPlaces) {
	return valueToMagnitude(value, 'Hz', fixedPlaces);
}

function valueToMagnitude(value, unit, fixedPlaces) {
	var idx = 0, i, sign;
	var unitExponents = [
		[0, ''],
		[3, 'k'],
		[6, 'M'],
		[9, 'G'],
		[12, 'T'],
		[15, 'P'],
		[18, 'E'],
		[21, 'Y']
	];

	// For high precision or very small numbers you may want
	// to look at https://gist.github.com/ajmas/4193ac6911f5445ced37

	sign = (value < 0 ? -1 : 1);
	value = Math.abs(value);
	
	for (i = unitExponents.length - 1; i >= 0; i--) {
		if (value >= Math.pow(10, unitExponents[i][0])) {
			idx = i;
			break;
		}
	}
	value = (value / Math.pow(10, unitExponents[idx][0]));

	value = value * sign;

	if (fixedPlaces !== undefined) {
		value = (value * 1.0).toFixed(fixedPlaces);
	}

	return value + ' ' + unitExponents[idx][1] + unit;
}

function populateRegionSelector(regionList) {
	$('#regionSelector').append('<optgroup label="ITU Regions" id="itu-regions-optgroup"/>');

	$.each(regionList, function(idx, entry) {
		if (entry.path.startsWith('itu')) {
			$('#itu-regions-optgroup')
				.append($("<option></option>")
				.attr("value", entry.path)
				.text(entry.region));
		}
	});

	$('#regionSelector').append('<optgroup label="Countries" id="countries-optgroup"/>');

	$.each(regionList, function(idx, entry) {
		if (!entry.path.startsWith('itu')) {
			$('#countries-optgroup')
				.append($("<option></option>")
				.attr("value", entry.path)
				.text(entry.region));
		}
	});

	$('#regionSelector').on('change', function(event, v) {
		$('#bands tbody').html('');
		loadAllocationTable($(this).val());
		document.location = '#' + $(this).val();
	});


	// Get the hash value, so we automatically load the right table

	var region = 'itu1';
	if (window.location.hash) {
		region = window.location.hash.substring(1);
	}

	$('#regionSelector').val(region);

	loadAllocationTable(region);
}

function loadAvailableRegions() {
	var url = baseRestPath + '/tables/index.json';
	$.getJSON(url, function(data) {
		populateRegionSelector(data);
	});
}

function capitaliseService(text) {
	var candidate = '', i;
	for (i = 0; i < services.length; i++) {
		if (text.startsWith(services[i]) && services[i].length > candidate.length) {
			candidate = services[i];
		}
	}
	return candidate.toUpperCase() + text.substring(candidate.length, text.length);
}

function footnoteLink(footnote, region) {
	if (footnote.match(/C[0-9].*/)) {
		return baseRestPath + '/footnotes/ca#' + footnote;
	} else if (footnote.match(/UK[0-9].*/)) {
		return baseRestPath + '/footnotes/gb#' + footnote;
	} else if (footnote.match(/EU[0-9].*/)) {
		return baseRestPath + '/footnotes/eu#' + footnote;
	}

	return baseRestPath + '/footnotes/itu#' + footnote;
}

function loadAllocationTable(region) {
	var url = baseRestPath + '/tables/' + region + '/index.json';
	
	$.getJSON(url, function(data) {
		var i, j, k, cellText, services, service, primary, footnotes;

		$('#official').html('<a href="' + data.metadata.official + '">' + data.metadata.official + '</a>');
		$('#message').html('Displaying information for region: ' + data.metadata.name_en);

		for (i = 0; i < data.bands.length; i++) {
			cellText = '';
			services = data.bands[i].services;
			if (services) {
				for (j = 0; j < services.length; j++) {
					primary = false;
					service = services[j].desc;
					if (services[j].cat === 'p') {
						service = capitaliseService(service);
						primary = true;
					}
					cellText += '<span class="' + (primary ? 'primary' : 'secondary') + '">' + service + '</span>';

					footnotes = data.bands[i].services[j].footnotes;

					if (footnotes && footnotes.length > 0) {
						for (k = 0; k < footnotes.length; k++) {
							cellText += ' <a href="' + footnoteLink(footnotes[k]) + '">' + footnotes[k] + '</a>'
						}
					}

					cellText += '<br/>';
				}
			}

			footnotes = data.bands[i].footnotes;
			if (footnotes && footnotes.length > 0) {
				for (j = 0; j < footnotes.length; j++) {
					cellText += '<a href="' + footnoteLink(footnotes[j]) + '">' + footnotes[j] + '</a> ';
				}
			}

			$('#bands tbody').append('<tr><td>' +
				'<span title="' + spacify(data.bands[i].lf, ' ') + ' Hz" >' + valueToMagnitude(data.bands[i].lf, 'Hz', 2) + '</span>' +
				' - ' +
				'<span title="' + spacify(data.bands[i].uf, ' ') + ' Hz" >' + valueToMagnitude(data.bands[i].uf, 'Hz', 2) + '</span>' +
				'</td><td>' + cellText + '</td></tr>');
		}

	});
}

function spacify(num, separator) {
	var str = num.toString().split('.');
	if (str[0].length >= 5) {
		str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1' + separator);
	}
	if (str[1] && str[1].length >= 5) {
		str[1] = str[1].replace(/(\d{3})/g, '$1 ');
	}
	return str.join('.');
}

$(document).ready(function() {
	loadAvailableRegions();
	drawSpectrum('spectrum');
});