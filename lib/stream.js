/**
* An object representing an OpenTok stream. This is passed into the callback function
* of the {@link OpenTok#getStream OpenTok.getStream()} method.
*
* @property {String} id
*   The stream ID of the stream.
*
* @property {String} name
*   The stream name (if one was set when the client published the stream).
*
* @property {Array} layoutClassList
*   An array of the layout classes for the stream. These layout classes are used in
*   customizing the layout in
*   <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/"> Live
*   streaming broadcasts</a> and
*   <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">
*   composed archives</a>.
*
* @property {String} videoType
*   Set to either "camera" or "screen". A "screen" video uses screen sharing on the publisher as
*   the video source; for other videos, this property is set to "camera".
*
* @see {@link OpenTok#dial OpenTok.dial()}
*
* @class Stream
*/
function Stream(json) {
  var properties = JSON.parse(json);
  var hasProp = {}.hasOwnProperty;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key)) {
      this[key] = properties[key];
    }
  }
}

module.exports = Stream;
