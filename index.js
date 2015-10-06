'use strict';

/**
 * Simplified http request.
 * (C) 2013-2014 MediaSmart Mobile.
 */

// requires
var http = require('http');
var https = require('https');
var urlLib = require('url');


/**
 * Access a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.get = function(url, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = {};
	}
	params = params || {};
	var options = urlLib.parse(url);
	send(options, params, callback);
};

/**
 * Post to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: the object to send, can be a JSON string.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.post = function(url, json, params, callback)
{
	var options = urlLib.parse(url);
	options.method = 'POST';
	sendBody(options, json, params, callback);
};

function sendBody(options, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = {};
	}
	params = params || {};
	if (typeof json == 'object')
	{
		params.body = JSON.stringify(json);
		options.headers = {
			'Content-Type': 'application/json',
			'Content-Length': params.body.length,
		};
	}
	else
	{
		params.body = json;
		options.headers = {
			'Content-Type': 'text/plain',
			'Content-Length': params.body.length,
		};
	}
	send(options, params, callback);
}

function send(options, params, callback)
{
	callback = callback || function() {};
	options.headers = options.headers || {};
	options.headers['user-agent'] = 'node.js basic-request bot';
	options.agent = null;
	sendWithRetries(params.retries, options, params, callback);
}

function sendWithRetries(retries, options, params, callback)
{
	var finished = false;
	var protocol = http;
	if (options.protocol == 'https:')
	{
		protocol = https;
	}
	var request = protocol.get(options, function(response)
	{
		if (response.statusCode == 301 || response.statusCode == 302)
		{
			// follow redirection
			var location = response.headers.location;
			request.abort();
			return exports.get(location, params, callback);
		}
		if (response.statusCode != 200)
		{
			if (finished)
			{
				return;
			}
			finished = true;
			request.abort();
			if (retries)
			{
				return sendWithRetries(retries - 1, options, params, callback);
			}
			return callback('Invalid status code ' + response.statusCode, {statusCode: response.statusCode});
		}
		var body = '';
		response.on('data', function (chunk)
		{
			body += chunk;
		});
		response.on('error', function(error)
		{
			if (finished)
			{
				return;
			}
			finished = true;
			if (retries)
			{
				return sendWithRetries(retries - 1, options, params, callback);
			}
			return callback('Error reading response: ' + error, {readingResponse: true});
		});
		response.setTimeout(params.timeout || 0, function()
		{
			if (finished)
			{
				return;
			}
			finished = true;
			if (retries)
			{
				return sendWithRetries(retries - 1, options, params, callback);
			}
			return callback('Timeout while reading response', {responseTimeout: true});
		});
		response.on('end', function()
		{
			if (finished)
			{
				return;
			}
			finished = true;
			return callback(null, body);
		});
		response.on('close', function()
		{
			if (finished)
			{
				return;
			}
			finished = true;
			return callback(null, body);
		});
	});
	request.setNoDelay();
	request.setTimeout(params.timeout || 0, function()
	{
		if (finished)
		{
			return;
		}
		finished = true;
		if (retries)
		{
			return sendWithRetries(retries - 1, options, params, callback);
		}
		return callback('Timeout while sending request', {requestTimeout: true});
	});
	request.on('error', function(error)
	{
		if (finished)
		{
			return;
		}
		finished = true;
		if (retries)
		{
			return sendWithRetries(retries - 1, options, params, callback);
		}
		return callback('Error sending request: ' + error, {sendingRequest: true});
	});
	if (params.body)
	{
		request.write(params.body);
	}
}

// show API if invoked directly
if (__filename == process.argv[1])
{
	console.log('Use in your code as:');
	console.log('  request.get(url, function(error, body) {});');
}

