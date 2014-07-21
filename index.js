'use strict';

/**
 * Simplified http request.
 * (C) 2013-2014 MediaSmart Mobile.
 */

// requires
require('prototypes');
var http = require('http');
var https = require('https');
var urlLib = require('url');


/**
 * Access a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.get = function(url, callback)
{
	var options = urlLib.parse(url);
	var request = send(options, callback);
	request.close();
};

/**
 * Post to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: the object to send, can be a JSON string.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.post = function(url, json, callback)
{
	var options = urlLib.parse(url);
	options.method = 'POST';
	var request = send(options, callback);
	if (typeof json == 'object')
	{
		json = JSON.stringify(json);
	}
	request.write(json);
	request.close();
};

function send(options, callback)
{
	var finished = false;
	var protocol = http;
	if (options.protocol == 'https')
	{
		protocol = https;
	}
	options.headers = {
		'user-agent': 'node.js basic-request bot',
	};
	var request = protocol.get(options, function(response)
	{
		if (response.statusCode == 301 || response.statusCode == 302)
		{
			// follow redirection
			var location = response.headers.location;
			request.abort();
			return exports.get(location, callback);
		}
		if (response.statusCode != 200)
		{
			finished = true;
			request.abort();
			return callback('Invalid status code ' + response.statusCode, {statusCode: response.statusCode});
		}
		var body = '';
		response.on('data', function (chunk)
		{
			body += chunk;
		});
		response.on('error', function(error)
		{
			finished = true;
			return callback('Error reading response: ' + error, {readingResponse: true});
		});
		response.on('end', function()
		{
			if (finished)
			{
				return;
			}
			request.end();
			return callback(null, body);
		});
	});
	request.on('error', function(error)
	{
		finished = true;
		return callback('Error sending request: ' + error, {sendingRequest: true});
	});
}

// run tests if invoked directly
if (__filename == process.argv[1])
{
	console.log('Use in your code as:');
	console.log('  request.get(url, function(error, body) {});');
}

