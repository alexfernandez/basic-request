const {send, getRawResponse, getRawParsed} = require('./lib/request.js')


/**
 * Access a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional contents to send, defaults to nothing.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *		- headers: object with headers.
 *		- agent: for repeated requests, see https://nodejs.org/api/http.html#http_class_http_agent.
 *		- buffer: if true, return raw buffer.
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
function get(url, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = json;
		json = null;
	}
	return send(url, 'GET', json, params, callback);
}

/**
 * The following exported functions all have the same parameters,
 * with only the method changing:
 *	- url: the URL to access.
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
function post(url, json, params, callback)
{
	return send(url, 'POST', json, params, callback);
}

function put(url, json, params, callback)
{
	return send(url, 'PUT', json, params, callback);
}

function patch(url, json, params, callback)
{
	return send(url, 'PATCH', json, params, callback);
}

function remove(url, json, params, callback)
{
	return send(url, 'DELETE', json, params, callback);
}

/**
 * Get the response to parse yourself. Parameters:
 *	- url: the URL to access.
 *	- method: string with the method to use ('GET', 'POST'...).
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
function getResponse(url, method, json, params, callback)
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
	getRawResponse(url, method, json, params, callback);
}

/**
 * Get the complete parsed object. Promises only.
 * Parameters same as above.
 * Parsed object contains:
 *	- status: HTTP status code.
 *	- headers: object with headers.
 *	- buffer: unparsed output buffer.
 *	- body: parsed body / JSON object.
 */
function getParsed(url, method, json, params) {
	return new Promise((resolve, reject) => {
		const parsed = getRawParsed(url, method, json, params, error => {
			if (error) return reject(error)
			return resolve(parsed)
		})
	})
}

module.exports = {
	get, post, put, patch, getResponse, getParsed
}
module.exports.delete = remove

