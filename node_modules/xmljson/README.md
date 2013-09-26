# xmljson

Translates between JSON and XML formats

[![Build Status](https://www.travis-ci.org/ExactTarget/node-xmljson.png?branch=master)](https://www.travis-ci.org/ExactTarget/node-xmljson)

## Getting Started
Install the module with: `npm install xmljson`

### Convert XML to JSON

```javascript
// Load the module
var to_json = require('xmljson').to_json;

// An XML string
var xml = '' +
	'<data>' +
		'<prop1>val1</prop1>' +
		'<prop2>val2</prop2>' +
		'<prop3>val3</prop3>' +
	'</data>';

to_json(xml, function (error, data) {
	// Module returns a JS object
	console.log(data);
	// -> { prop1: 'val1', prop2: 'val2', prop3: 'val3' }

	// Format as a JSON string
	console.log(JSON.stringify(data));
	// -> {"prop1":"val1","prop2":"val2","prop3":"val3"}
});
```

### Convert JSON to XML

```javascript
// Load the module
var to_xml = require('xmljson').to_xml;

// A JSON string
var json = '' +
	'{' +
		'"prop1":"val1",' +
		'"prop2":"val2",' +
		'"prop3":"val3"' +
	'}';

to_xml(json, function (error, xml) {
	// Module returns an XML string
	console.log(xml);
	// -> <data><prop1>val1</prop1><prop2>val2</prop2><prop3>val3</prop3></data>
});
```

## Release History

_This module is semantically versioned: <http://semver.org>_

### Version 0.2.0 `2013-07-27`

* Support child elements where some have duplicate names and some do not

### Version 0.1.0 `2013-05-29`

* Initial release

## Contributing
Before writing code, we suggest you [search for issues](https://github.com/ExactTarget/node-xmljson/issues?state=open)
or [create a new one](https://github.com/ExactTarget/node-xmljson/issues/new) to confirm where your contribution fits into
our roadmap.

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.
Lint and test your code using [grunt](https://github.com/cowboy/grunt).

##Authors

**Adam Alexander**

+ http://twitter.com/adamalex
+ http://github.com/adamalex

**Benjamin Dean**

+ https://twitter.com/bdeanet
+ https://github.com/creatovisguru

## Copyright and license

Copyright (c) 2013 ExactTarget

Licensed under the MIT License (the "License");
you may not use this work except in compliance with the License.
You may obtain a copy of the License in the COPYING file.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
