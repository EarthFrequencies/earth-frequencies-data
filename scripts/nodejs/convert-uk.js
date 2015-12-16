'use strict'

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var console = require('console');
var naturalSort = require('javascript-natural-sort')
var app     = express();

var defaultFootnoteRegexes = [/^UK.*/];

var sourceUrl = 'http://www.ofcom.org.uk/static/spectrum/data/fatMapping.json';
var defaultOutputFolder = __dirname + '/../../data/allocation-tables/gb/';
var defaultAllocationsFilename = 'allocations.txt';
var defaultFootnotesFilename = 'footnotes.txt';

var userAgent = 'EarthFrequencies 0.1';

var baseRequest = request.defaults({
  headers: {
  	'User-Agent': userAgent
  }
});

function stringify(text) {
    text = JSON.stringify(text);
    text = text.substring(1,text.length-1);
    return text;
}

function convertSetToString(theSet) {
    var text = '', entry;
    theSet.forEach(function (value) {
        text += value;
        text += ', ';    
    });
    if (text.length > 0) {
       text = text.substring(0, text.length-2);
    }
    return text;
}

function findFootnotesIdsForEntry(allFootnotes, id) {    
    var matching = new Set(), i;
    for (i=0; i<allFootnotes.length; i++) {
        if (allFootnotes[i].id === id ) {
            matching.add(allFootnotes[i].cid);
        }
    }
    return matching;
}

function generateAllocationsFile(data, outputFolder, filename) {
    var i, bands, outputLine;
    if (!outputFolder) {
        outputFolder = defaultOutputFolder;
    }
    if (!filename) {
        filename = defaultAllocationsFilename;
    }   
    console.info('Generating allocations file...'); 
        
    fs.truncateSync(outputFolder + '/' + filename, 0, function (error) { } );
    
    
    fs.appendFileSync(outputFolder + '/' + filename, 'Region\tSub-table\tStart Frequency\tEnd Frequency\tCategory\Service\tFootnotes\n');
    bands = data.bands;
    for (i=0; i<bands.length; i++) {
        outputLine =
           'gb' + '\t' +
           '' + '\t' + 
           bands[i].lf + '\t' +
           bands[i].uf + '\t' +
           bands[i].cat + '\t' +                  
           bands[i].s + '\t' +
           convertSetToString(findFootnotesIdsForEntry(data.footnotes, bands[i].id));
        console.log(outputLine); 
        fs.appendFileSync(outputFolder + '/' + filename, outputLine + '\n');

    }
}

function generateFootnotesFile(data, outputFolder, filename, footnoteRegexes) {
    var i, j, footnotes, outputLine, processedCIDs, regex, match, footnoteRefs, footnotesMap;

    if (!outputFolder) {
        outputFolder = defaultOutputFolder;
    }
    if (!filename) {
        filename = defaultFootnotesFilename;
    }     
    console.info('Generating footnotes file...');   
    
    fs.truncateSync(outputFolder + '/' + filename, 0, function (error) { } );
    
    footnoteRefs = [];
    footnotesMap = {};
    processedCIDs = new Set();    
    footnotes = data.footnotes;
    for (i=0; i<footnotes.length; i++) {
       if (processedCIDs.has(footnotes[i].cid)) {
           continue;
       }
       
       processedCIDs.add(footnotes[i].cid);

       match = false;
       for (j=0; j<footnoteRegexes.length; j++) {
           if (String(footnotes[i].cid).match(footnoteRegexes[j])) {
               match = true;
               break;
           }
       }
       
       if (!match) {
           continue;
       }     
        
       footnoteRefs.push(footnotes[i].cid);
       footnotesMap[footnotes[i].cid] = footnotes[i].t;           
          
    }   
    
    footnoteRefs.sort(naturalSort);
    
    for (i=0; i<footnoteRefs.length; i++) {
       outputLine = 
           footnoteRefs[i] + '\t' +
           stringify(footnotesMap[footnoteRefs[i]]);
       console.log(outputLine); 
       fs.appendFileSync(outputFolder + '/' + filename, outputLine + '\n');     
    }    
}

function fetchAllocationsData (url) {
	baseRequest(url, function(error, response, data) {
		if(!error){
		    var jsonObj = JSON.parse(data);
            
			generateAllocationsFile(jsonObj, defaultOutputFolder, defaultAllocationsFilename);
			generateFootnotesFile(jsonObj, defaultOutputFolder, defaultFootnotesFilename, defaultFootnoteRegexes);			
		} else {
			console.error('error:' + error);
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