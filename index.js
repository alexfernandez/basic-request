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
 *	- json: optional contents to send, defaults to nothing.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *		- headers: object with headers.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.get = function(url, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = json;
		json = null;
	}
	send(url, 'GET', json, params, callback);
};

/**
 * Post to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: the object to send, can be a JSON string.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *		- headers: object with headers.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.post = function(url, json, params, callback)
{
	send(url, 'POST', json, params, callback);
};

/**
 * Put to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: the object to send, can be a JSON string.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *		- headers: object with headers.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.put = function(url, json, params, callback)
{
	send(url, 'PUT', json, params, callback);
};

function send(url, method, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = {};
	}
	else if (typeof json == 'function')
	{
		callback = json;
		params = {};
		json = null;
	}
	callback = callback || function() {};
	var options = urlLib.parse(url);
	options.method = method;
	options.headers = {};
	if (json)
	{
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
	}
	options.headers['user-agent'] = 'node.js basic-request bot';
	for (var key in params.headers)
	{
		options[key] = params.headers[key];
	}
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
		request.write(params.body, 'utf8');
	}
	request.end();
}

// show API if invoked directly
if (__filename == process.argv[1])
{
	console.log('Use in your code as:');
	console.log('  request.get(url, function(error, body) {});');
}

