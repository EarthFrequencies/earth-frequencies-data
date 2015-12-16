'use strict'

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var console = require('console');
var naturalSort = require('javascript-natural-sort')
var app     = express();

var defaultFootnoteRegexes = [/^UK.*/];

var sourceUrl = 'http://localhost/~ajmas/data/sf10759.html';//'http://www.ic.gc.ca/eic/site/smt-gst.nsf/eng/sf10759.html';
var defaultOutputFolder = __dirname + '/../../data/allocation-tables/ca/';
var defaultAllocationsFilename = 'allocations.txt';

var bandFootnoteRegexes = [ /^C[0-9]+/, /^5\.[0-9]+[A-Z]?/ ];
var serviceFootnoteRegexes = [ /(C[0-9]+)/, /(5\.[0-9]+[A-Z]?)/ ];

var userAgent = 'EarthFrequencies 0.1';

var baseRequest = request.defaults({
  headers: {
  	'User-Agent': userAgent
  }
});

function convertToHertz ( value, unit ) {
    value = Number(value);
	
    if ( unit === 'Hz' ) {
    	value = value;
    } else if ( unit === 'kHz' ) {
    	value = value * 1000;
    } else if ( unit === 'MHz' ) {
    	value = value * 1000000;    
    } else if ( unit === 'GHz' ) {
    	value = value * 1000000000;    
    } else {
    	return undefined;
    }
   	return Math.round(value);
}

function bandStrToArray(bandStr, unit) {
    var parts;

    bandStr = bandStr.replace(/\ /g,'');
    parts = bandStr.split('-');

    return [
    	convertToHertz(parts[0], unit), 
    	convertToHertz(parts[1], unit)
    	];
}

function getText(element, debug) {
	var text = '';
		
	if (!element) {
		return 'zz';
	}
	
	if (element.length) {
		if (element.length === 1) {
			element = element[0];
		} else if (element.length > 0 ) {
			var i=0;
			for (i=0; i<element.length; i++) {
				var tmpText =  getText(element[i]).replace(/\r\n/g,'\n', debug);
				tmpText =  tmpText.replace(/\n\n/g,'\n');		
				text += tmpText;
				text += '\n';
			}
			return text;
		}
		
	}
		
	if (element.type === 'text') {
		return element.data;
	} 
	
	if (element.type === 'tag' && element.name === 'br') {
		text += '\n';
		return text;
	}
	
	if (element.type === 'tag' && element.name === 'a') {
		text += element.children[0].data;		
		return text;
	}
	
	if (element.type === 'tag' && element.name === 'span') {
	    if ( debug ) {
	        console.log('xxxxx ....', element.children[0]);
	    }
	    if (element.children.length === 1) {
    		text += ' <' + element.children[0].data + '> ' ;
			return text;
    	}
	}	
		
	var children = element.children;
	if (children.length > 0) {
		var i=0;
		for (i=0; i<children.length; i++) {
			text += getText(children[i], debug);
		}
	}
	
	return text;
}


function parseCellText(text, band) {
    var parts, bandInfo, i, j, serviceInfo, matchInfo;
    text = text.replace(/\<primary service\>/g,'');
    text = text.replace(/\<end primary service\>/g,'');
    text = text.replace(/\ +\n/g,'\n');
    text = text.replace(/\n\ +/g,'\n')
    text = text.replace(/\ +/g,' ');
    text = text.replace(/^\ +/g,'');
    parts = text.split('\n');
    
    bandInfo = {
       services: [],
       footnotes: []
    }
    
    
    for (i=0; i<parts.length; i++) {
       matchInfo = undefined;
       for (j=0; j<bandFootnoteRegexes.length; j++) {
           matchInfo = parts[i].match(bandFootnoteRegexes[j]);
           if (matchInfo) {
               bandInfo.footnotes = parts[i].trim().split(' ');
               break;
           }       
       }

       // Deal with a wrapping issue in source data
       if (parts[i].startsWith('    ')) {
           bandInfo.services[bandInfo.services.length-1].footnotes = bandInfo.services[bandInfo.services.length-1].footnotes.concat(parts[i].trim().split(' '));
           console.log('----------------');
           console.log(band,  bandInfo.services[bandInfo.services.length-1].name, parts[i] );
           continue;
       }
                       
       // We didn't match, so we aren't a band footnote
       if (!matchInfo) {
           matchInfo = undefined;
           serviceInfo = {
               name: '',
               footnotes: []
           };           
                
           for (j=0; j<serviceFootnoteRegexes.length; j++) { 
                matchInfo = parts[i].match(serviceFootnoteRegexes[j]);
                if (matchInfo) {
                    serviceInfo.name = parts[i].substring(0, matchInfo.index).trim();
                    serviceInfo.footnotes = parts[i].substring(matchInfo.index).trim().split(' ');
                    break;
                }
           }
           
           if (!matchInfo) {       
               serviceInfo.name = parts[i];
           }
           
           if (serviceInfo.name.trim().length !== 0 ) {
               bandInfo.services.push(serviceInfo);
           }
       }
    }
    return bandInfo;
}

function generateAllocationsFile($, outputFolder, filename) {
    var i, j, k, bands, outputLine, elements, unit, tbody, rows, cells, band, bandInfo, text, debug;
    if (!outputFolder) {
        outputFolder = defaultOutputFolder;
    }
    if (!filename) {
        filename = defaultAllocationsFilename;
    }   
    
	console.info('Generating allocations file...'); 

	fs.truncateSync(outputFolder + '/' + filename, 0, function (error) { } );

	fs.appendFileSync(outputFolder + '/' + filename, 'Region\tSub-table\tStart Frequency\tEnd Frequency\tService\tFootnotes\n');

    elements = $('table');
    
    for (i=0; i<elements.length; i++) {
        if ( $('caption.bg-primary', elements[i]).text().startsWith('Canadian Table of Frequency Allocations')) {
            unit = $('th',null, elements[i])[0].children[0].data;        
        } else {
            continue;
        }
        
        tbody =  $('tbody', null, elements[i]);
        rows = $('tr', tbody);
        
        // Process each cell in the row. We are expecting two per row
        for (j=0; j<rows.length; j++) {
             cells = $('td', rows[j]);
             if (cells[0].children[0].data) {
	             band = bandStrToArray(cells[0].children[0].data, unit);//.join(',');
	             text = getText(cells[1]);	             
	             bandInfo = parseCellText(text, band);
	             
	             if (bandInfo.footnotes && bandInfo.footnotes.length) {
	                 fs.appendFileSync(outputFolder + '/' + filename, 
	                 	['ca', '', band[0], band[1], '-', bandInfo.footnotes.join(',')].join('\t') + '\n'
	                 	);
	             }
	             for (k=0; k<bandInfo.services.length; k++) {	                 	                 
	                 fs.appendFileSync(outputFolder + '/' + filename,
	                 	['ca', '', band[0], band[1], bandInfo.services[k].name, bandInfo.services[k].footnotes.join(',')].join('\t') + '\n'
	                 	);
	             }	             
    	     }
        }            
    }

}

function fetchAllocationsData (url) {
	baseRequest(url, function(error, response, html) {
		if(!error){
            var dom = cheerio.load(html);
            
			generateAllocationsFile(dom, defaultOutputFolder, defaultAllocationsFilename);
		} else {
			console.error('error', error);
		}
	});
}

function main() {
    fetchAllocationsData(sourceUrl);
}

main();


// This file is written with Node JS in mind.
//
// Requirements:
//   - Node JS
//   - npm
//
// To setup (assumming availability of node and npm):
//   - in current dir, at command line: npm install .
//
// To run: 
//   - in command line: node convert-uk.js [base folder] 