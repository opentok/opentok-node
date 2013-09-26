/*
 * xmljson
 * https://github.com/ExactTarget/node-xmljson
 *
 * Copyright (c) 2013 ExactTarget
 * Licensed under the MIT license.
 */

var parse = require('xml2js').parseString;

// The purpose of to_json is to convert XML into the desired JavaScript object structure.
// As a first step, the xml2js module parses the provided XML into an object.  The remaining
// logic converts that object into the expected structure.
// See https://github.com/Leonidas-from-XIV/node-xml2js for xml2js info.

module.exports = function (xml, callback) {
	return parse(xml, { explicitArray: false }, function (error, data) {
		if (error) return callback(error);

		// At this point, the XML has already been parsed into a JavaScript object.
		// The structure is not always what is expected of this module.  Uncomment
		// the following line to take a look.
		// console.log(require('util').inspect(data, false, null));

		// Apply recursive function to convert to the expected structure.
		data = applyStructureChanges(data);

		// If we have { data: 'SOME_DATA_HERE' } convert to 'SOME_DATA_HERE'
		if (Object.keys(data)[0] === 'data') {
			data = data.data;
		}

		return callback(null, data);
	});
};

// This recursive function operates on every node of our object, applying proper
// datatypes and removing the type attribute used to specify them.

function applyStructureChanges(data) {
	var item, newArray, newObject, i;

	if (typeof data === 'object' && data !== null) {
		if (Object.keys(data).length === 2 && (data._ != null || data.item != null) && data.$ && data.$.type != null) {
			// This is a value with a specified data type.  Return the data as appropriate type.
			switch (data.$.type) {
				case 'array':
					item = data['item'];

					// Wrap in array if not represented as one
					if (!Array.isArray(item)) item = [ item ];

					newArray = [];
					for (i = 0; i < item.length; i++) {
						newArray[i] = applyStructureChanges(item[i]);
					}
					return newArray;
				case 'num':
					return Number(data._).valueOf();
				case 'bool':
					return data._ === 'true';
				case 'null':
					return null;
				default:
					return data._;
			}
		} else {
			// This is a regular object.  Process its contents normally.
			newObject = {};
			for (var key in data) {
				newObject[key] = applyStructureChanges(data[key]);
			}
			return newObject;
		}
	} else {
		// This is a bare value.  Simply return it.
		return data;
	}
}
