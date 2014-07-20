'use strict';

/**
 * Run package tests.
 * (C) 2014 Alex Fernández.
 */

// requires
var testing = require('testing');
var request = require('./index.js');


/**
 * Test the request.
 */
function testRequest(callback)
{
	request.get('http://www.google.com/', function(error, result)
	{
		testing.check(error, 'Could not access Google', callback);
		testing.assert(result.contains('Google'), 'Invalid contents for Google page', callback);
		request.get('http://www.google.com/fake_page', function(error)
		{
			testing.assert(error, 'Could access fake page', callback);
			testing.success(callback);
		});
	});
}

/**
 * Run all module tests.
 */
exports.test = function(callback)
{
	testing.run([testRequest], 4200, callback);
};

// run tests if invoked directly
if (__filename == process.argv[1])
{
	exports.test(testing.show);
}

