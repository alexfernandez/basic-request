const http = require('http');
const https = require('https');
const urlLib = require('url');


function parse(url, method, json, params) {
	return new Parsed(url, method, json, params)
}

class Parsed {
	constructor(url, method, json, params = {}) {
		this.url = url
		this.method = method
		this.json = json
		this.params = params
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
				this.bodyToSend = JSON.stringify(this.json);
				options.headers = {
					'Content-Type': 'application/json',
				};
			}
			else
			{
				this.bodyToSend = String(this.json);
				options.headers = {
					'Content-Type': 'text/plain',
				};
			}
			options.headers['Content-Length'] = Buffer.byteLength(this.bodyToSend)
		}
		options.headers['user-agent'] = 'node.js basic-request bot';
		for (const key in this.params.headers)
		{
			options.headers[key] = this.params.headers[key];
		}
		options.agent = this.params.agent || null;
		let protocol = http;
		if (options.protocol == 'https:')
		{
			protocol = https;
		}
		const request = protocol.request(options, response => {
			this.status = response.statusCode
			if (this.status == 301 || this.status == 302)
			{
				// follow redirection
				this.url = response.headers.location;
				request.abort();
				return this.getRawResponse(callback)
			}
			if (this.status != 200 && this.status != 204)
			{
				request.abort();
				return callback('Invalid status code ' + this.status, {statusCode: this.status});
			}
			if (this.params.timeout)
			{
				response.setTimeout(this.params.timeout, () => {
					return callback('Timeout while reading response', {responseTimeout: true});
				});
			}
			return callback(null, response);
		});
		request.setNoDelay();
		if (this.params.timeout)
		{
			request.setTimeout(this.params.timeout, () => {
				return callback('Timeout while sending request', {requestTimeout: true});
			});
		}
		request.on('error', error => {
			return callback('Error sending request: ' + error, {sendingRequest: true});
		});
		request.on('aborted', () => {
			return callback('Request aborted', {requestAborted: true});
		});
		if (this.bodyToSend)
		{
			request.write(this.bodyToSend, 'utf8');
		}
		request.end();
	}

	parseBody(response, callback) {
		let finished = false;
		this.chunks = [];
		this.headers = response.headers
		response.on('data', chunk => {
			this.chunks.push(chunk);
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
			this.finishParsing(callback)
		});
		response.on('close', () => {
			if (finished) return;
			finished = true;
			this.finishParsing(callback)
		});
	}

	finishParsing(callback) {
		this.buffer = Buffer.concat(this.chunks)
		const contentType = this.headers['content-type']
		if (contentType && contentType.includes('application/json'))
		{
			try {
				this.body = JSON.parse(this.buffer)
			} catch(error) {
				return callback(error, String(this.buffer))
			}
		} else {
			this.body = String(this.buffer)
		}
		callback(null, this.getResult())
	}

	getResult()
	{
		if (this.params.buffer) return this.buffer;
		return this.body;
	}
}

module.exports = {parse}

