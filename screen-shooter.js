// Imports
const electron 			= require('electron');
const desktopCapturer 	= electron.desktopCapturer;
const electronScreen 	= electron.screen;
const shell 			= electron.shell;
const remote 			= electron.remote;
const app				= electron.app;

const fs 	= require('fs');
const os 	= require('os');
const path 	= require('path');

const currentWindow = remote.getCurrentWindow();
var initialized = false;

//let RectangleElement = require("./RectangleElement.js");

// Theme
const OVERLAY_COLOR		= 'rgba(0, 0, 0, 0.5)';
const HANDLE_RECT_COLOR	= 'rgba(0, 125, 216, 1)';
const HANDLE_COLOR 		= 'rgba(16, 98, 158, 1)';

const DEFAULT_NAME 			= 'screenshot';
const DEFAULT_EXTENSTION 	= '.png';
const DEFAULT_PATH	= remote.app.getPath('desktop');

// Variables
const canvas 	= document.getElementById("canvas");
const ctx 		= canvas.getContext("2d");

var imgBuff = null;
var img 	= null;
var index 	= 0;
var selectionMode = false;
var ctrDown = false;


const screenSize = {
	width: 		electronScreen.getPrimaryDisplay().size.width * electronScreen.getPrimaryDisplay().scaleFactor,
	height: 	electronScreen.getPrimaryDisplay().size.height * electronScreen.getPrimaryDisplay().scaleFactor,
}

var expRect = {
	minX: 0, 
	minY: 0,
	maxX: screenSize.width,
	maxY: screenSize.height,
};

function partCapture(){
	initialize();
	
	expRect = {
		minX: 0, 
		minY: 0,
		maxX: screenSize.width,
		maxY: screenSize.height,
	};

	let options = {
		types: ['screen'],
		thumbnailSize: screenSize
	};

	desktopCapturer.getSources(options , function(error, sources) {
		if (error) return console.log(error.message);

		sources.forEach(function(source){
			if(source.name === 'Entire screen' || source.name === 'Screen 1'){

				imgBuff = source.thumbnail;
				img = new Image();
				img.onload = function () {
					//ctx.drawImage(img, 0, 0, screenSize.width, screenSize.height);
					//console.log("post-draw", new Date().getTime() / 1000);
					//drawHandle(ctx, {x: 0, y: 0}, {x: 0, y: 0});
					ctx.fillStyle = "rgb(255, 0, 0)";
					ctx.fillRect(0, 0, screenSize.width, screenSize.height);


//					currentWindow.once('ready-to-show', () => {
					console.log("pre-show", new Date().getTime() / 1000);
					//currentWindow.setFullScreen(true);
					currentWindow.show();
					//currentWindow.setOpacity(1);

					
					console.log("post-show", new Date().getTime() / 1000);
//					});

					
				}
				img.src = imgBuff.toDataURL();
				console.log("setting url", new Date().getTime() / 1000);
			}
		});
	});
}

function hide(){
	// Reset canvas
	currentWindow.hide();
	canvas.width = canvas.width;

	ctx.fillStyle = "rgb(0, 255, 0)";
	ctx.fillRect(0, 0, screenSize.width, screenSize.height);
	//currentWindow.setOpacity(0);
}

function normexpRect(){
	var minX = expRect.minX; 
	var minY = expRect.minY; 
	var maxX = expRect.maxX; 
	var maxY = expRect.maxY; 
	expRect.minX = Math.min(minX, maxX);
	expRect.minY = Math.min(minY, maxY);
	expRect.maxX = Math.max(minX, maxX);
	expRect.maxY = Math.max(minY, maxY);
}

function transformHandle(e){
	draw({x: expRect.minX, y: expRect.minY}, {x: e.clientX, y: e.clientY});			
}

function initialize(){
	if(initialized) return;
	initialized = true;

	// Set defaults
	canvas.width = screenSize.width;
	canvas.height= screenSize.height;


	// Add Listeners
	window.addEventListener("mousedown", function(e){
		expRect.minX = e.clientX;
		expRect.minY = e.clientY;

		window.addEventListener("mousemove", transformHandle);
	});

	window.addEventListener("mouseup", function(e){
		expRect.maxX = e.clientX;
		expRect.maxY = e.clientY;
		normexpRect();

		console.log(expRect);

		window.removeEventListener("mousemove", transformHandle);
	});

	window.addEventListener("keydown", function(e){
		if(e.key == "Control") 		ctrDown = true;
		if(e.key == "s" && ctrDown) writeImage();
	});

	window.addEventListener("keyup", function(e){
		if(e.key == "Control") ctrDown = false;
	});	
}

function writeImage(){
	var rect = {
		x: expRect.minX,
		y: expRect.minY,
		width: expRect.maxX - expRect.minX,
		height: expRect.maxY - expRect.minY,
	}
	fs.writeFile(path.join(DEFAULT_PATH, DEFAULT_NAME + new Date().getTime() + DEFAULT_EXTENSTION), imgBuff.crop(rect).toPNG(), function(err){
		if(err) return console.log(err.message);

		hide();
	});
}

function draw(minP, maxP){
	ctx.drawImage(img, 0, 0, screenSize.width, screenSize.height);
	drawHandle(ctx, minP, maxP);
}

function drawHandle(ctx, minP, maxP){

	var handle_width = 30;
	var handle_height = 5;
	var handle_radius = 5;

	// OVERLAY
	ctx.fillStyle = OVERLAY_COLOR;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(screenSize.width, 0);
	ctx.lineTo(screenSize.width, screenSize.height);
	ctx.lineTo(0, screenSize.height);
	ctx.lineTo(0, 0);
	ctx.moveTo(minP.x, minP.y);
	ctx.lineTo(minP.x, maxP.y);
	ctx.lineTo(maxP.x, maxP.y);
	ctx.lineTo(maxP.x, minP.y);
	ctx.lineTo(minP.x, minP.y);
	ctx.fill();

	// BUG-QUAD
	ctx.beginPath();
	ctx.strokeStyle = HANDLE_RECT_COLOR;
	ctx.rect(minP.x, minP.y, maxP.x-minP.x, maxP.y-minP.y);
	ctx.stroke();

	// 4 XY-SIZEING-HANDLES
	ctx.beginPath();
	ctx.fillStyle = HANDLE_COLOR;
	ctx.moveTo(minP.x, minP.y);
	ctx.arc(minP.x, minP.y, handle_radius, 0, 2*Math.PI);
	ctx.moveTo(maxP.x, minP.y);
	ctx.arc(maxP.x, minP.y, handle_radius, 0, 2*Math.PI);
	ctx.moveTo(maxP.x, maxP.y);
	ctx.arc(maxP.x, maxP.y, handle_radius, 0, 2*Math.PI);
	ctx.moveTo(minP.x, maxP.y);
	ctx.arc(minP.x, maxP.y, handle_radius, 0, 2*Math.PI);
	ctx.fill();


	// 2 Y-SIZEING-HANDLES
	ctx.beginPath();
	ctx.fillStyle = HANDLE_COLOR;
	ctx.rect(minP.x + (((maxP.x-minP.x)/2.0) - (handle_width/2.0)), minP.y - (handle_height/2.0), handle_width, handle_height);
	ctx.rect(minP.x + (((maxP.x-minP.x)/2.0) - (handle_width/2.0)), maxP.y - (handle_height/2.0), handle_width, handle_height);
	ctx.fill();
	
	// 2 X-SIZEING-HANDLES
	ctx.beginPath();
	ctx.fillStyle = HANDLE_COLOR;
	ctx.rect(minP.x - (handle_height/2.0), minP.y + (((maxP.y-minP.y)/2.0) - (handle_width/2.0)), handle_height, handle_width);
	ctx.rect(maxP.x - (handle_height/2.0), minP.y + (((maxP.y-minP.y)/2.0) - (handle_width/2.0)), handle_height, handle_width);
	ctx.fill();


	//let rect = new RectangleElement({x: 20, y: 20}, 20, 100, "rgb(255, 0, 0)");
	//rect.draw(ctx);
}

module.exports = {
	fullCapture: function() {
		return fullCapture();
	},
	partCapture: function(){
		return partCapture();
	},
	hide: function() {
		return hide();
	},
};


















var forceRedraw = function(element){

    if (!element) { return; }

    var n = document.createTextNode(' ');
    var disp = element.style.display;  // don't worry about previous display style

    element.appendChild(n);
    element.style.display = 'none';

    setTimeout(function(){
        element.style.display = disp;
        n.parentNode.removeChild(n);
    },20); // you can play with this timeout to make it as short as possible
}