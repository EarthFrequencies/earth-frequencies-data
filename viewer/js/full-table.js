'use strict'

var baseRestPath = '../rest';
var allocationTable = {};



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
	var candidate = '',
		i;
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

		allocationTable = data;

		$('#official').html('<a href="' + data.metadata.official + '">' + data.metadata.official + '</a>');
		$('#message').html('Displaying information for region: ' + data.metadata.name_en);
		$('#edition').html(data.metadata.edition);

		renderAllocationsTable(true);
	});
}



function isInFilteredRange(band, startFreq, endFreq) {
	return (band.uf > startFreq && band.lf < endFreq);
}

function renderAllocationsTable(reloaded) {
	var startFreq, endFreq, bands, filteredActvitities, filteredServices, tableIdx, displayBand;
	var i, j, k, cellText, services, service, primary, footnotes, freqBand, activity, activities = [];

	startFreq = $('input[name=\'startFreq\']').val();

	if (!startFreq || startFreq.trim().length === 0) {
		startFreq = 0;
	} else {
		startFreq = parseInt(startFreq.trim());
		startFreq = startFreq * 1000;
	}

	endFreq = $('input[name=\'endFreq\']').val();

	if (!endFreq || endFreq.trim().length === 0) {
		endFreq = 1000000000000;
	} else {
		endFreq = parseInt(endFreq.trim());
		endFreq = endFreq * 1000;
	}

	if ( endFreq < startFreq ) {
	    endFreq = 0;
	    startFreq = 0;
	}

    filteredActvitities = $('select[name=\'activity\']').val();
    filteredServices = $('select[name=\'service\']').val();

	highlightDisplayedRange(startFreq, endFreq);

	$('#bands tbody').html('');

    for (tableIdx = 0; tableIdx < allocationTable.tables.length; tableIdx++) {

        activity =  allocationTable.tables[tableIdx].name;

        if ( allocationTable.tables[tableIdx].name ) {
        	activities.push(allocationTable.tables[tableIdx].name);
        } else {
            activities.push('Activity ' + (tableIdx+1) );
        }

		// if we are filtering on activity, then apply the filter. Assumes single select
        if (!reloaded && (filteredActvitities && filteredActvitities.trim().length > 0)) {
			if (parseInt(filteredActvitities) !== tableIdx) {
			     continue;
			}
        }


		bands = allocationTable.tables[tableIdx].bands;

		for (i = 0; i < bands.length; i++) {
		    displayBand = true;
			freqBand = bands[i];

			if (!isInFilteredRange(freqBand, startFreq, endFreq)) {
				continue;
			}

			if (filteredServices && filteredServices.trim().length > 0) {
			    displayBand = false;
			}

			cellText = '';
			services = freqBand.services;
			if (services) {
				for (j = 0; j < services.length; j++) {
					primary = false;
					service = services[j].desc;
					if (services[j].cat === 'p') {
						service = capitaliseService(service);
						primary = true;
					}

					if (filteredServices && filteredServices.trim().length > 0) {
						if (service === filteredServices.toUpperCase()) {
							displayBand = true;
						}
					}

					cellText += '<span class="' + (primary ? 'primary' : 'secondary') + '">' + service + '</span>';

					footnotes = freqBand.services[j].footnotes;

					if (footnotes && footnotes.length > 0) {
						for (k = 0; k < footnotes.length; k++) {
							cellText += ' <a href="' + footnoteLink(footnotes[k]) + '">' + footnotes[k] + '</a>'
						}
					}

					cellText += '<br/>';
				}
			}

			footnotes = freqBand.footnotes;
			if (footnotes && footnotes.length > 0) {
				for (j = 0; j < footnotes.length; j++) {
					cellText += '<a href="' + footnoteLink(footnotes[j]) + '">' + footnotes[j] + '</a> ';
				}
			}

			if (displayBand) {
				$('#bands tbody').append(
					'<tr class="activity-' + (activities.length + 1) +'"><td>' +
					'<span title="' + spacify(freqBand.lf, ' ') + ' Hz" >' + valueToMagnitude(freqBand.lf, 'Hz', 2) + '</span>' +
					' - ' +
					'<span title="' + spacify(freqBand.uf, ' ') + ' Hz" >' + valueToMagnitude(freqBand.uf, 'Hz', 2) + '</span>' +
					'</td>' +
					'<td>' + activity + '</td>' +
					'<td>' + cellText + '</td></tr>');
			}
		}
	}

    if (reloaded) {
        $('select[name=\'activity\']').html('<option value="">All</option>');
        if (activities.length > 1) {
            for (i=0; i<activities.length; i++) {
	            $('select[name=\'activity\']').append('<option value="'  + i + '">' + activities[i] + '</option>');
	        }
        } else {
        	$('select[name=\'activity\'] option').attr('title', 'only one activity table available');
        }
        $('select[name=\'activity\']').attr('disabled',  activities.length < 2);
    }
}


function applyFilter () {
    renderAllocationsTable(false);
}

$(document).ready(function() {
 	var i;
	loadAvailableRegions();
	drawSpectrum('spectrum');

	for (i=0; i<services.length; i++) {
		$('select[name=\'service\']').append('<option value="'  + services[i] + '">' + services[i] + '</option>');
	}

	$('#applyFilter').on('click', function() {
		applyFilter();
	});
});