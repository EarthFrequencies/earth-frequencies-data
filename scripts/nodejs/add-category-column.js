'use strict'

var express = require('express');
var fs = require('fs');
var cheerio = require('cheerio');
var console = require('console');
var app     = express();

var services = [];


Array.prototype.clone = function() {
	return this.slice(0);
};

function isLatinUpperCase(character){
      return /[A-Z]|[\u0080-\u024F]/.test(character) && character === character.toUpperCase();
};

function loadServicesFile() {
    var servicesFilePath = __dirname + '/../../data/allocation-tables/itu/services.txt';
    
    fs.readFileSync(servicesFilePath).toString().split('\n').forEach(function (line) {
        services.push(line.trim());
    });
    
    services.sort(function (x, y) {
         if (x.length < y.length) {
             return 1;
         } else if (x.length > y.length) {
             return -1;
         }
         return 0;
    });    
}

function processAllocationsFile (filePath) {
    var lineIdx=-1, fieldNames = {};
            
	fs.readFileSync(filePath).toString().split('\n').forEach(function (line) {
	    var fields, i, j, service, matchedService, category = '';
	    
   	    lineIdx++;

	    if (lineIdx === 0) {
	        fields = line.split('\t');
	        for (i=0; i<fields.length; i++) {
	             fieldNames[fields[i]] = i;
	        }
 	        
 	        if (fieldNames['Category']) {
 	            throw 'There is already a category column';
 	        }
 	        
 	        fields.splice(fieldNames['End Frequency'] + 1,0,'Category')
 	        
 	        console.log(fields.join('\t'));
 	        
	    } else {
			if (line.trim().length > 0) {
				fields = line.split('\t');			
				if (fields.length < 4) {
					console.error('Error','less columns than expected', lineIdx, line);	
					return;				
				}
			    service = fields[fieldNames['Service']];
			    
// 			    if (service === undefined)
			    for (j=0; j<services.length; j++) {
			        if (service.toLowerCase().startsWith(services[j].toLowerCase())) {
			            matchedService = services[j];
			        } 

			        if (matchedService) {
			            if (isLatinUpperCase(service.charAt(1))) {
			                category = 'p';
			            } else {
			                category = 's';
			            }
			            break;
			        }
			    }
			    
			    if (matchedService) {
   			        service = matchedService + service.substring(matchedService.length, service.length);			        
			    }
			    
			    if ( ! (matchedService || service === '-' || service === '(not allocated)') ) {
			        console.warn('warning', 'Unknown service', lineIdx, line);			    
			    }
				fields[fieldNames['Service']] = service;
				fields[fieldNames['Footnotes']] = fields[fieldNames['Footnotes']].split('  ').join(',');
				fields.splice(fieldNames['End Frequency'] + 1, 0, category);
				console.log(fields.join('\t'));
			    // } 
// 			    else {			      
// 			        console.error('ERROR', 'Unknown service', lineIdx, line);
// 			    }
    		}
	    }	
	    
	});
}

function main() {
    if (process.argv.length !== 3) {
       console.error('Error: Please specify a file to process');
    } else {
        loadServicesFile();
        processAllocationsFile (process.argv[2]);
        
    }
}

main();