const http = require('http');
const https = require('https');
const urlLib = require('url');


function parse(url, method, json, params) {
	return new Parsed(url, method, json, params)
}

class Parsed {
	constructor(url, method, json, params) {
		this.url = url
		this.method = method
		this.json = json
		this.params = params
		this.body = null
	}

	getRawResponse(callback)
	{
		const options = urlLib.parse(this.url);
		options.method = this.method;
		options.headers = {};
		if (this.json)
		{
			if (typeof this.json == 'object')
			{
				this.params.body = JSON.stringify(this.json);
				options.headers = {
					'Content-Type': 'application/json',
					'Content-Length': this.params.body.length,
				};
			}
			else
			{
				this.params.body = this.json;
				options.headers = {
					'Content-Type': 'text/plain',
					'Content-Length': this.params.body.length,
				};
			}
		}
		options.headers['user-agent'] = 'node.js basic-request bot';
		for (const key in this.params.headers)
		{
			options.headers[key] = this.params.headers[key];
		}
		options.agent = this.params.agent || null;
		let finished = false;
		let protocol = http;
		if (options.protocol == 'https:')
		{
			protocol = https;
		}
		const request = protocol.request(options, response => {
			if (response.statusCode == 301 || response.statusCode == 302)
			{
				// follow redirection
				this.url = response.headers.location;
				request.abort();
				return this.getRawResponse(callback)
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
			if (this.params.timeout)
			{
				response.setTimeout(this.params.timeout, () => {
					if (finished) return;
					finished = true;
					return callback('Timeout while reading response', {responseTimeout: true});
				});
			}
			return callback(null, response);
		});
		request.setNoDelay();
		if (this.params.timeout)
		{
			request.setTimeout(this.params.timeout, () => {
				if (finished) return;
				finished = true;
				return callback('Timeout while sending request', {requestTimeout: true});
			});
		}
		request.on('error', error => {
			if (finished) return;
			finished = true;
			return callback('Error sending request: ' + error, {sendingRequest: true});
		});
		request.on('aborted', () => {
			if (finished) return;
			finished = true;
			return callback('Request aborted', {requestAborted: true});
		});
		if (this.params.body)
		{
			request.write(this.params.body, 'utf8');
		}
		request.end();
	}

	parseBody(response, callback) {
		let finished = false;
		this.body = [];
		this.headers = response.headers
		response.on('data', chunk => {
			this.body.push(chunk);
		});
		response.on('error', error => {
			if (finished) return;
			finished = true;
			return callback('Error reading response: ' + error, {readingResponse: true});
		});
		response.on('aborted', () => {
			if (finished) return;
			finished = true;
			return callback('Response aborted', {responseAborted: true});
		});
		response.on('end', () => {
			if (finished) return;
			finished = true;
			return callback(null, this.getResult());
		});
		response.on('close', () => {
			if (finished) return;
			finished = true;
			return callback(null, this.getResult());
		});
	}

	getResult()
	{
		const buffer = Buffer.concat(this.body)
		const contentType = this.headers['content-type']
		if (contentType && contentType.includes('application/json'))
		{
			try {
				return JSON.parse(buffer)
			} catch(error) {
				return {error, body: String(buffer)}
			}
		}
		if (this.params.buffer) return buffer;
		return String(buffer);
	}
}

module.exports = {parse}

