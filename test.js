'use strict';

/**
 * Run package tests.
 * (C) 2014 Alex Fernández.
 */

// requires
require('prototypes');
var testing = require('testing');
var request = require('./index.js');


/**
 * Test get.
 */
function testGet(callback)
{
	request.get('http://www.google.com/', function(error, result)
	{
		testing.check(error, 'Could not access Google', callback);
		testing.assert(result.contains('Google'), 'Invalid contents for Google page', callback);
		request.get('http://www.google.com/fake_page', function(error)
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

function testPost(callback)
{
	var json = {scopes: ['public_repo']};
	request.post('https://api.github.com/authorizations', json, function(error, result)
	{
		testing.assert(error, 'Should not post to GitHub', callback);
		testing.assert(result, 'Should have returned something', callback);
		testing.assertEquals(result.statusCode, 401, 'Should not be authorized', callback);
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
		testPost,
	], 60000, callback);
};

// run tests if invoked directly
if (__filename == process.argv[1])
{
	exports.test(testing.show);
}

