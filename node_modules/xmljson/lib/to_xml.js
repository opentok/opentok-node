/*
 * xmljson
 * https://github.com/ExactTarget/node-xmljson
 *
 * Copyright (c) 2013 ExactTarget
 * Licensed under the MIT license.
 */

var xmlbuilder = require('xmlbuilder');

// The purpose of to_xml is to build an XML string from the provided JSON string.  The XML
// should be built in a way that running it through to_json will result in the original JSON.

module.exports = function (json, callback) {
	try {
		// Use data as the root XML node
		var builder = xmlbuilder.create().begin('data');

		// Apply recursive function to create XML contents
		buildXml(JSON.parse(json), builder);

		// Return the completed XML
		callback(null, builder.end({ pretty: false, indent: '', newline: '' }));
	} catch (error) {
		callback(error);
	}
};

// This recursive function operates on every node of our object, creating
// equivalent XML structure with proper datatype annotations (attributes).
// See https://github.com/oozcitak/xmlbuilder-js for xmlbuilder info.

function buildXml(data, builder) {
	var type = typeof data;

	if (type === 'object' && data !== null) {
		if (Array.isArray(data)) {
			// data is an array, mark as array and recurse
			builder.att('type', 'array');
			for (var i = 0; i < data.length; i++) {
				buildXml(data[i], builder.ele('item'));
			}
		} else {
			// data is an object, recurse
			for (var key in data) {
				if ('$' === key) {
					// Handle node attributes
					for (var att in data[key]) {
						builder.att( att, data[key][att] );
					}
				} else if ('_' === key) {
					// This is the text content of a node
					builder.txt(data[key]);
				} else if (isArrayishObject(data[key])) {
					// Object with numeric keys, treat as separate elements
					for (var x in data[key]) {
						// Build a new child node
						buildXml(data[key][x], builder.ele(key));
					}
				} else {
					// Build a new child node
					buildXml(data[key], builder.ele(key));
				}
			}
		}
	} else {
		// data is a value, create with appropriate type attribute
		if (type === 'boolean') {
			builder.att('type', 'bool');
		} else if (type === 'number') {
			builder.att('type', 'num');
		} else if (data === null) {
			builder.att('type', 'null');
			data = 'null';
		}

		builder.txt(data);
	}
}

// Detects objects where all keys are numeric
function isArrayishObject(data) {
	if (typeof data !== 'object') return false;
	if (Array.isArray(data)) return false;
	if (data == null) return false;

	for (var key in data) {
		if (isNaN(+key)) return false;
	}

	return true;
}