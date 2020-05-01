const {send, getRawResponse} = require('./lib/request.js')


/**
 * Access a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional contents to send, defaults to nothing.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *		- headers: object with headers.
 *		- agent: for repeated requests, see https://nodejs.org/api/http.html#http_class_http_agent.
 *		- buffer: if true, return raw buffer
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
 * Post to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
function post(url, json, params, callback)
{
	return send(url, 'POST', json, params, callback);
}

/**
 * Put to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
function put(url, json, params, callback)
{
	return send(url, 'PUT', json, params, callback);
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

module.exports = {get, post, put, getResponse}

