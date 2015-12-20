'use strict'

var scale = 30;
var leftOffset = 15;
var paper;
var filteredRangeRect;

Raphael.el.addClass = function(className) {
	this.node.setAttribute("class", className);
	return this;
};

function drawSpectrum(elementId) {
	var canvasDiv, canvas, ctx, i;

	var textElem, rect;
	paper = Raphael(elementId);

	highlightRegulatedBand(paper, 0, 1000000000000);

	for (i = 0; i < 26; i += 1) {
		if (i % 2 === 0) {
			var x = (i * scale) + leftOffset;

			paper.path(
				'M' + x + ' ' + 20 +
				'L' + x + ' ' + (paper.height - 10));
			var text = '10 ' + superscriptNumber(i);
			textElem = paper.text(x, 10, text);

			textElem.attr('x', x + 3);
		} else {
			// 				var x = (i * scale) + leftOffset;			
			// 				var waveLength = wavelengthInMetres(Math.pow(10,i));
			// 				waveLength = waveLength * 1000;
			// 				
			// 				var exp = getBaseLog(10, waveLength);
			// 				text = '10 '+ superscriptNumber(exp);		
			// 				metrics = ctx.measureText(text);
			// 			
			// 				ctx.fillText(text, x-(metrics.width/3), 80);		    
		}

	}

	highlightVisibleBand(paper);


}


function highlight(paper, startFreq, endFreq, color, text, title, cssClass, rect) {
	var textElem, height, width, text, x1, x2;

	x1 = (startFreq !== 0 ? getBaseLog(10, startFreq) : 0);
	x2 = 0;

	if (endFreq === Infinity) {
		x2 = paper.width;
	} else {
		x2 = getBaseLog(10, endFreq);
		x2 = (x2 * scale) + leftOffset;
	}

	x1 = (x1 * scale) + leftOffset;

	height = paper.height;
	width = x2 - x1;

	if (!rect) {
		rect = paper.rect(x1, 1, width, height - 2);
	} else {
		rect.attr('x', x1);
		rect.attr('y', 1);
		rect.attr('width', width)
		rect.attr('height', height - 2);
	}

	rect.attr("fill", color);
	rect.attr("stroke", color);
	rect.attr('title', title);

	if (cssClass && cssClass.trim().length > 0) {
		rect.addClass(cssClass);
	}

	//    if (text && text.trim().length > 0) {
	//        var metrics = {
	//            width: 20
	//         	};
	//         	
	//        var fx = width / 2 - metrics.width / 2;
	//        var fy = 80;//100 / 2 - fontHeight / 2;
	//        
	//        textElem = paper.text(x1 + fx, fy / 2, text);
	//    }      

	return rect;
}

function highlightDisplayedRange(startFreq, endFreq) {
	filteredRangeRect = highlight(paper, startFreq, endFreq, 'rgba(240,240,100,0.5)', '', 'Regulated spectrum', 'regulatedspectrum', filteredRangeRect);
}

function highlightRegulatedBand(paper) {
	var startFreq, endFreq;

	startFreq = 0;
	endFreq = 1000000000000;

	highlightDisplayedRange(startFreq, endFreq)
}


function highlightVisibleBand(paper) {
	var gradient, start, end, x1, x2;

	start = 4.8 * Math.pow(10, 14);
	end = 7.0 * Math.pow(10, 14);

	gradient = '0-red-orange-yellow-green-blue-indigo-violet';
	highlight(paper, start, end, gradient, '', 'visible spectrum');
}


function getBaseLog(x, y) {
	return Math.log(y) / Math.log(x);
}

// Issues with rendering, need to investigate
function superscriptNumber(intNumber) {
	var text = '',
		number, supers, digit;
	number = Math.round(intNumber);
	supers = '⁰¹²³⁴⁵⁶⁷⁸⁹'.split('');
	if (intNumber === 0) {
		text = supers[0];
	} else {
		while (Math.floor(number) > 0) {
			digit = number % 10;
			number = Math.floor(number / 10);
			text = supers[digit] + text;
		}
	}
	return text;
}