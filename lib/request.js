const {parse} = require('./parse.js');


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
	getRawParsed(url, method, json, params, function(error, result)
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

function getRawParsed(url, method, json, params, callback)
{
	const parsed = getRawResponse(url, method, json, params, (error, response) => {
		if (error) return callback(error, response);
		parsed.parseBody(response, callback)
	})
	return parsed
}

function getRawResponse(url, method, json, params, callback)
{
	const parsed = parse(url, method, json, params)
	let finished = false
	parsed.getRawResponse((error, response) => {
		if (finished) return
		finished = true
		return callback(error, response)
	})
	return parsed
}

module.exports = {send, getRawResponse, getRawParsed}

