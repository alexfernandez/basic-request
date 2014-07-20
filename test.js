'use strict';

/**
 * Run package tests.
 * (C) 2014 Alex Fernández.
 */

// requires
var testing = require('testing');


/**
 * Run all module tests.
 */
exports.test = function(callback)
{
	var tests = {
		index: require('./index.js').test,
	};
	testing.run(tests, 4200, callback);
};

// run tests if invoked directly
if (__filename == process.argv[1])
{
	exports.test(testing.show);
}

