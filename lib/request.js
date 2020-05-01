'use strict';

/**
 * Simplified http request.
 * (C) 2013-2017 MediaSmart Mobile.
 * (C) 2018-2020 Alex Fernández <alexfernandeznpm@gmail.com>
 */

// requires
const http = require('http');
const https = require('https');
const urlLib = require('url');


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
	} else if (!params) {
		params = {}
	}
	if (callback)
	{
		return sendWithRetries(params.retries, url, method, json, params, callback);
	}
	return new Promise((resolve, reject) => {
		sendWithRetries(params.retries, url, method, json, params, (error, result) => {
			if (error) return reject(new RequestError(error, result))
			return resolve(result)
		});
	})
}

class RequestError extends Error
{
	constructor(message, result)
	{
		super(message)
		this.name = this.constructor.name
		for (const key in result)
		{
			this[key] = result[key]
		}
	}
}

function sendWithRetries(retries, url, method, json, params, callback)
{
	sendWithResponse(url, method, json, params, function(error, result)
	{
		if (error)
		{
			if (retries)
			{
				return sendWithRetries(retries - 1, url, method, json, params, callback);
			}
			return callback(error, result);
		}
		return callback(null, result)
	});
}

function sendWithResponse(url, method, json, params, callback)
{
	getRawResponse(url, method, json, params, function(error, response)
	{
		if (error) return callback(error, response);
		if (!response)
		{
			return callback(null, null)
		}
		let finished = false;
		const body = [];
		response.on('data', function (chunk)
		{
			body.push(chunk);
		});
		response.on('error', function(error)
		{
			if (finished) return;
			finished = true;
			return callback('Error reading response: ' + error, {readingResponse: true});
		});
		response.on('aborted', function()
		{
			if (finished) return;
			finished = true;
			return callback('Response aborted', {responseAborted: true});
		});
		response.on('end', function()
		{
			if (finished) return;
			finished = true;
			return callback(null, getResult(body, params, response));
		});
		response.on('close', function()
		{
			if (finished) return;
			finished = true;
			return callback(null, getResult(body, params, response));
		});

	})
}

function getRawResponse(url, method, json, params, callback)
{
	const options = urlLib.parse(url);
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
	for (const key in params.headers)
	{
		options.headers[key] = params.headers[key];
	}
	options.agent = params.agent || null;
	let finished = false;
	let protocol = http;
	if (options.protocol == 'https:')
	{
		protocol = https;
	}
	const request = protocol.request(options, function(response)
	{
		if (response.statusCode == 301 || response.statusCode == 302)
		{
			// follow redirection
			const location = response.headers.location;
			request.abort();
			return getRawResponse(location, method, json, params, callback)
		}
		if (response.statusCode == 204)
		{
			if (finished) return;
			finished = true;
			return callback(null, null);
		}
		if (response.statusCode != 200)
		{
			if (finished) return;
			finished = true;
			request.abort();
			return callback('Invalid status code ' + response.statusCode, {statusCode: response.statusCode});
		}
		if (params.timeout)
		{
			response.setTimeout(params.timeout, function()
			{
				if (finished) return;
				finished = true;
				return callback('Timeout while reading response', {responseTimeout: true});
			});
		}
		return callback(null, response);
	});
	request.setNoDelay();
	if (params.timeout)
	{
		request.setTimeout(params.timeout, function()
		{
			if (finished) return;
			finished = true;
			return callback('Timeout while sending request', {requestTimeout: true});
		});
	}
	request.on('error', function(error)
	{
		if (finished) return;
		finished = true;
		return callback('Error sending request: ' + error, {sendingRequest: true});
	});
	request.on('aborted', function()
	{
		if (finished) return;
		finished = true;
		return callback('Request aborted', {requestAborted: true});
	});
	if (params.body)
	{
		request.write(params.body, 'utf8');
	}
	request.end();
}

function getResult(body, params, response)
{
	const buffer = Buffer.concat(body)
	const contentType = response.headers['content-type']
	if (contentType && contentType.includes('application/json'))
	{
		try {
			return JSON.parse(buffer)
		} catch(error) {
			return {error, body: String(buffer)}
		}
	}
	if (params.buffer) return buffer;
	return String(buffer);
}

module.exports = {send, getRawResponse}

