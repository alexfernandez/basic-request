[![Build Status](https://secure.travis-ci.org/alexfernandez/basic-request.png)](http://travis-ci.org/alexfernandez/basic-request)

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

That is it! No wading through responses, parsing status codes or anything else;
basic-response will do that for you. It even follows redirects!

You can see a couple of examples in [the test file](https://github.com/alexfernandez/basic-request/blob/master/test.js).

## *BLOAT ALERT*

A couple of additional features have crept in.

### Retries

The basic-request package now supports retries:

    request.get('http://www.google.com/', {retries: 2}, function(error, body) {
        if (error) {
            console.error('Could not access Google with retries: %s', error);
            return;
        }
        console.log('Received %s', body);
    });

### PUT and POST

The basic-request package now supports PUT and POST methods,
and will even stringify objects into JSON for you:

    request.post('http://www.google.com/', {attribute: 'value'}, function(error, body) {
        if (error) {
            console.error('Could not access Google with POST: %s', error);
            return;
        }
        console.log('Received %s', body);
    });

and likewise with `request.put()`.

## License

(The MIT License)

Copyright (c) 2013 Alex Fernández <alexfernandeznpm@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

