'use strict';

/**
 * Run package tests.
 * (C) 2014 Alex Fernández.
 */

// requires
const testing = require('testing');
const request = require('./index.js');


function testGet(callback)
{
	request.get('http://httpbin.org/', function(error, result)
	{
		testing.check(error, 'Could not access httpbin', callback);
		testing.assert(result.includes('httpbin'), 'Invalid contents for httpbin page', callback);
		request.get('http://httpbin.org/fake_page', function(error)
		{
			testing.assert(error, 'Could access fake page', callback);
			request.get('http://askdjfsjljwer.soiueiruouoisfoisdo.reuioweiwr/', function(error)
			{
				testing.assert(error, 'Could access fake domain', callback);
				testing.success(callback);
			});
		});
	});
}

function testGetRetries(callback)
{
	const params = {retries: 3};
	request.get('https://qeriouosdfs.qruiojojsdlksfjl.ciouior/', params, function(error)
	{
		testing.assert(error, 'Should not access fake domain with retries', callback);
		testing.success(callback);
	});
}

async function testAsyncGet()
{
	const result1 = await request.get('http://httpbin.org/')
	testing.assert(result1.includes('httpbin'), 'Invalid contents for httpbin page')
	const result2 = await request.get('http://httpbin.org/', {send: 'whatever'})
	testing.assert(result2.includes('httpbin'), 'Invalid contents with json')
	const result3 = await request.get('http://httpbin.org/', {send: 'whatever'}, {timeout: 1000})
	testing.assert(result3.includes('httpbin'), 'Invalid contents with timeout')
}

async function testAsyncGetJson()
{
	const result = await request.get('http://httpbin.org/json')
	testing.equals(typeof result, 'object', 'Invalid type for JSON result')
}

async function testAsyncGetParsed()
{
	const parsed = await request.getParsed('http://httpbin.org/', 'get', {send: 'whatever'})
	testing.equals(typeof parsed, 'object', 'Invalid parsed result')
	testing.equals(parsed.status, 200)
	testing.assert(parsed.body, 'Missing body')
	testing.assert(parsed.headers, 'Missing headers')
}

async function testAsyncError()
{
	try
	{
		await request.get('http://httpbin.org/fake')
		throw new Error('Should never get here')
	}
	catch (error)
	{
		testing.equals(error.statusCode, 404, 'Should return not found')
	}
}

function testPost(callback)
{
	const json = {scopes: ['public_repo']};
	request.post('https://httpbin.org/post', json, function(error, result)
	{
		testing.check(error, 'Should post to httpbin', callback);
		testing.assert(result, 'Should have returned something', callback);
		request.post('https://s3.amazonaws.com/', {nothing: true}, function(error, result)
		{
			testing.assert(error, 'Should not post to S3', callback);
			testing.assert(result, 'Should have got a result from S3', callback);
			testing.assert(result.statusCode >= 400, 'Should have got a 4xx from S3', callback);
			testing.success(callback);
		});
	});
}

async function testAsyncPost()
{
	const json = {scopes: ['public_repo']};
	const result1 = await request.post('https://httpbin.org/post', json)
	testing.assert(result1, 'Should have returned something');
	testing.assert(result1.json, 'Should have original JSON');
	const result2 = await request.post('https://httpbin.org/post', json, {timeout: 1000})
	testing.assert(result2, 'Should have returned something with params');
	testing.assert(result2.json, 'Should have returned original JSON with params');
	const accented = {scopes: 'pèré'};
	const result3 = await request.post('https://httpbin.org/post', accented)
	testing.assert(result3, 'Should have returned something');
	testing.assert(result3.json, 'Should have original JSON with accents');
}

function testRedirectToPost(callback)
{
	const json = {scopes: ['public_repo']};
	const url = 'http://httpbin.org/redirect-to?url=http%3A%2F%2Fhttpbin.org%2Fpost'
	request.post(url, json, function(error, result)
	{
		testing.check(error, 'Should redirect post to httpbin', callback);
		testing.assert(result, 'Should have returned something', callback);
		testing.success(callback);
	});
}

function testPut(callback)
{
	const json = {scopes: ['public_repo']};
	request.put('https://httpbin.org/put', json, function(error, result)
	{
		testing.check(error, 'Should put to httpbin', callback);
		testing.assert(result, 'Should have returned something', callback);
		testing.success(callback);
	});
}

function testPostHeaders(callback)
{
	const params = {headers: {
		'content-type': 'text/json',
	}};
	const json = {scopes: ['public_repo']};
	request.post('https://httpbin.org/post', json, params, function(error, result)
	{
		testing.check(error, 'Should post to httpbin', callback);
		testing.assert(result, 'Should have returned something', callback);
		testing.success(callback);
	});
}

/**
 * Run all module tests.
 */
exports.test = function(callback)
{
	testing.run([
		testGet,
		testGetRetries,
		testAsyncGet,
		testAsyncGetJson,
		testAsyncGetParsed,
		testAsyncError,
		testPost,
		testAsyncPost,
		testRedirectToPost,
		testPut,
		testPostHeaders,
	], 60000, callback);
};

// run tests if invoked directly
if (__filename == process.argv[1])
{
	exports.test(testing.show);
}

