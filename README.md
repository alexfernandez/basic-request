# basic-request

A very basic library to request a URL and get a result.

## Why Another Request Library?

There are approximately 10000 request packages in npm. This one adds no extra dependencies,
and uses the node.js convention of `function(error, result)` without any added parameters.
No longer will you need to check the status code of the response; basic-request treats all
status codes other than 200 as errors.

As an extra, basic-request follows redirects.

## Usage

Install with npm:

    npm install basic-request

In your code just require the package:

    var request = require('basic-request');

and then use `get()` with a callback in the traditional node.js fashion:

    request.get('http://www.google.com/', function(error, body) {
        if (error) {
            console.error('Could not access Google: %s', error);
            return;
        }
        console.log('Received %s', body);
    });

