'use strict'

var express = require('express');
var fs = require('fs');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var console = require('console');
var naturalSort = require('javascript-natural-sort')
var Freemarker = require('freemarker.js')
var app     = express();

var defaultFootnoteRegexes = [/^UK.*/];

var sourceUrl = 'http://www.ofcom.org.uk/static/spectrum/data/fatMapping.json';
var allocationsTablesDir = __dirname + '/../../data/allocation-tables/';
var baseOutputDir = __dirname + '/../../rest';
var defaultAllocationsFilename = 'allocations.txt';
var defaultFootnotesFilename = 'footnotes.txt';

var userAgent = 'EarthFrequencies 0.1';

var baseRequest = request.defaults({
  headers: {
      'User-Agent': userAgent
  }
});

var fm = new Freemarker({
  viewRoot: __dirname + '/resources/templates',
  options: {
    /** for fmpp */
  }
});

function isDirectoryExists(filePath) {
    try {
        return fs.statSync(filePath).isDirectory();
    } catch (e) {
        return false;
    }
}

function isFileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (e) {
        return false;
    }
}

function mkdirSync(filePath) {
    if (!isDirectoryExists(filePath)) {
        fs.mkdirSync(filePath);
    }
}

function createBaseOutputDirectoryTree(outputPath) {
    var fsPath;

    if (!isDirectoryExists(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    fsPath = path.join(outputPath, 'footnotes');
    if (!isDirectoryExists(fsPath)) {
        fs.mkdirSync(fsPath);
    }

    fsPath = path.join(outputPath, 'tables');
    if (!isDirectoryExists(fsPath)) {
        fs.mkdirSync(fsPath);
    }
}


function createBaseOutputDirectoryTree(outputPath) {

}

function processDirectories (basePath, outputPath) {
    var availableFootnotes = [], availableAllocationTables = [], allMetadata = {};


    createBaseOutputDirectoryTree(outputPath);



    fs.readdirSync(basePath).filter(function(file) {
        var data, childPath, fileStats, fsOutDir, fsOutFile, fsInFile, metadata;

        childPath = path.join(basePath, file);
        fileStats = fs.statSync(childPath);


        if (fileStats.isDirectory()) {
            metadata = {};

            console.log('processing ' + file);


            // Handle the metadata

            fsInFile = path.join(childPath, 'metadata.txt');

            if (isFileExists(fsInFile)) {
                metadata = readMetadata(fsInFile);
                allMetadata[file] = metadata;
            }

            // Handle the allocation tables

            fsInFile = path.join(childPath, 'allocations.txt');
            fsOutDir = outputPath +  '/tables/' + file;
            mkdirSync(fsOutDir);

            if (isFileExists(path.join(childPath, '/allocations.txt'))) {

                availableAllocationTables.push(file);

                fsOutFile= path.join(fsOutDir, 'index.json');
                generateJsonAllocations ( fsInFile,  metadata, fsOutFile );

                fsOutFile= path.join(fsOutDir, 'index.html');
                generateHtmlAllocations ( fsInFile,  metadata, fsOutFile );

            } else {
                console.warn('warn', 'no allocation tables found for ' + file, fsInFile );
            }


            // Handle the footnotes

            fsInFile = path.join(childPath, 'footnotes.txt');
            fsOutDir= outputPath +  '/footnotes/' + file;


            mkdirSync(fsOutDir);

            if (isFileExists(fsInFile)) {

                availableFootnotes.push(file);

                fsOutFile= path.join(fsOutDir, 'index.json');
                generateJsonFootnotes( fsInFile, fsOutFile, metadata );

                fsOutFile= path.join(fsOutDir, 'index.html');
                generateHtmlFootnotes( fsInFile, fsOutFile, metadata );
            } else {
                console.warn('warn', 'no footnotes found for ' + file, fsInFile);
            }
        }

     });

     generateHtmlAllocationsIndex(
         outputPath +  '/tables/' + 'index.html', availableAllocationTables, allMetadata);

     generateHtmlFootnotesIndex(
         outputPath +  '/footnotes/' + 'index.html', availableFootnotes, allMetadata);

}


function readMetadata(inputFilepath) {
    var metadata = {}, lineIdx = -1;

    fs.readFileSync(inputFilepath).toString().split('\n').forEach(function (line) {
        var fields;

        lineIdx++;

        if (lineIdx === 0 ) {
            return;
        }

        if (line.trim().length > 0) {
            fields = line.split('\t');
            metadata[fields[0]] = fields[1];
        }

    });

    return metadata;
}


// You will need to ensure JAVA_HOME is defined. The errors aren't very user friendly,
// but often it will be down to undeclared properties
function render(templateName, dataObject) {
    return fm.renderSync(templateName, dataObject);
}

function generateHtmlFootnotesIndex (outputFilePath, availableFootnotes, allMetadata) {
    var html, rows = '', i, name;

    for (i=0; i<availableFootnotes.length; i++) {
        name = '';

        if (allMetadata[availableFootnotes[i]]) {
            if (allMetadata[availableFootnotes[i]].name_en) {
                name = allMetadata[availableFootnotes[i]].name_en;
            } else if (allMetadata[availableFootnotes[i]].name) {
                name = allMetadata[availableFootnotes[i]].name;
            }
        }

        rows += '<tr>' +
            '<td>' + name + '</td>' +
            '<td>' + availableFootnotes[i] + '</td>' +
            '<td><a href="' + availableFootnotes[i] + '/index.html">html</a>, ' +
            '<a href="' + availableFootnotes[i] + '/index.json">json</a></td>' +
            '</tr>';
    }

    html = render('footnotes-index.html', {
        rows: rows
    });

    fs.writeFileSync(outputFilePath, html);
}

function generateJsonFootnotes (inputFilepath, outputFilePath, regionName) {

    var footnotes = [];

    fs.readFileSync(inputFilepath).toString().split('\n').forEach(function (line) {
        var fields;

        if (line.trim().length > 0) {
            fields = line.split('\t');
            if (fields.length >= 2 ) {

                footnotes.push( {
                    id: fields[0],
                    text: fields[1]
                    });
            }
        }
    });

    console.log('writing out: ' + outputFilePath);
    fs.writeFileSync(outputFilePath, JSON.stringify(footnotes, null, ''));

}

function generateHtmlFootnotes (inputFilepath, outputFilePath, metadata) {
   var footnotes = [], rows = '', html, regionName, official;

    if (metadata.name_en) {
        regionName = metadata.name_en;
    } else if (metadata.name) {
        regionName = metadata.name;
    }

    if (metadata.official) {
        official = '<a href="' + metadata.official + '">official source</a>';
    }

   fs.readFileSync(inputFilepath).toString().split('\n').forEach(function (line) {
        var fields, text;

        if (line.trim().length > 0) {
            fields = line.split('\t');
            if (fields.length >= 2 ) {
                text = fields[1];
                text = text.replace(/\\n/g,'<br/>');
                rows += '   <tr id="' + fields[0] + '"><td>'  + fields[0] + '</td><td class="detail">' + text + '</td></tr>\n';
            }
        }
    });

    html = render('footnotes.html', {
        title: 'Footnotes for ' + regionName,
        official: official,
        rows: rows
    });

    console.log('writing out: ' + outputFilePath);
    fs.writeFileSync(outputFilePath, html);

}





function generateHtmlAllocationsIndex (outputFilePath, availableAllocationTables, allMetadata) {
    var html, rows = '', i, name;

    for (i=0; i<availableAllocationTables.length; i++) {
        name = '';

        if (allMetadata[availableAllocationTables[i]]) {
            if (allMetadata[availableAllocationTables[i]].name_en) {
                name = allMetadata[availableAllocationTables[i]].name_en;
            } else if (allMetadata[availableAllocationTables[i]].name) {
                name = allMetadata[availableAllocationTables[i]].name;
            }
        }

        rows += '<tr>' +
            '<td>' + name + '</td>' +
            '<td>' + availableAllocationTables[i] + '</td>' +
            '<td><a href="' + availableAllocationTables[i] + '/index.html">html</a>, ' +
            '<a href="' + availableAllocationTables[i] + '/index.json">json</a></td>' +
            '</tr>';
    }

    html = render('allocationtables-index.html', {
        rows: rows
    });

    fs.writeFileSync(outputFilePath, html);
}

function generateHtmlAllocations(allocationsFilePath, metadata, outputFilePath) {

}

function generateJsonAllocations(allocationsFilePath, metadata, outputFilePath) {
     var allocationsTable, lineIdx = -1, fieldNames = {}, bandInfo, currentBand = -1, i, tables = {};
     var file, previousActivity, key;

     allocationsTable = {
        tables: []
         };

     if (metadata) {
         allocationsTable.metadata = metadata;
     }


     fs.readFileSync(allocationsFilePath).toString().split('\n').forEach(function (line) {
         var fields = [], serviceInfo, activity;

         lineIdx++;

         fields = line.split('\t');

         if (lineIdx === 0) {
            for (i=0; i<fields.length; i++) {
                 fieldNames[fields[i]] = i;
            }
            return;
         }

         if (line.trim().length === 0 ) {
            return;
         }


         activity = fields[fieldNames['Activity']];

         if (!activity || activity.trim().length === 0) {
		     activity = '-';
         }

         if (currentBand !== fields[fieldNames['Start Frequency']]) {

              if (bandInfo) {
                  if (!previousActivity) {
                      previousActivity = activity;
                  }

                  if (!tables[previousActivity]) {
                      tables[previousActivity] = {
                          name: activity,
                          bands: []
                          };

                  }
                  tables[previousActivity].bands.push(bandInfo);
              }
              bandInfo = {
                  lf: fields[fieldNames['Start Frequency']],
                  uf: fields[fieldNames['End Frequency']]
              }

              currentBand = fields[fieldNames['Start Frequency']];
         }

         if (fields[fieldNames['Service']] === '(not allocated)') {
             bandInfo.comment = fields[fieldNames['Service']];
         } else if (fields[fieldNames['Service']] === '-' && fields[fieldNames['Footnotes']].length > 0 ) {
             bandInfo.footnotes = fields[fieldNames['Footnotes']].split(/,\ */);
         } else {
             serviceInfo = {
                 desc: fields[fieldNames['Service']],
                 cat: fields[fieldNames['Category']],
             };

             if (fields[fieldNames['Footnotes']].trim().length > 0) {
                 serviceInfo.footnotes = fields[fieldNames['Footnotes']].trim().split(/,\ */);
             }

             if (!bandInfo.services) {
                 bandInfo.services = [];
             }
             bandInfo.services.push(serviceInfo);
         }

         previousActivity = activity;
     });

     for(key in tables) {
         allocationsTable.tables.push(tables[key]);
     }


     // Writes out the JSON, minified
     fs.writeFileSync(outputFilePath, JSON.stringify(allocationsTable, null, ''));
}

function main() {
    //fetchAllocationsData(sourceUrl);
    processDirectories(allocationsTablesDir, baseOutputDir);
//     console.log(render('footnotes-template.html', {
//         title: 'xyz', rows: 'xxx' }));
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