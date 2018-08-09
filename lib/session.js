/**
* Represents an OpenTok session. Use the {@link OpenTok#createSession OpenTok.createSession()}
* method to create an OpenTok session. The <code>sessionId</code> property of the Session object
* is the session ID.
*
* @property {String} sessionId The session ID.
*
* @class Session
*/
var Session = function Session(ot, sessionId, properties) {
  var prop;
  this.ot = ot;
  this.sessionId = sessionId;
  for (prop in properties) {
    if ({}.hasOwnProperty.call(properties, prop)) {
      this[prop] = properties[prop];
    }
  }
};

/**
* Gets info about a stream. The stream must be an active stream in the OpenTok session.
*
* @param options {String} The stream ID.
*
* @param callback {Function} The function to call upon completing the operation. Two arguments
* are passed to the function:
*
* <ul>
*
*   <li>
*      <code>error</code> &mdash; An error object (if the call to the method fails). This is
*      set to null if there is no error. Calling this method results in an error if you pass in
*      an invalid stream ID or an invalid session ID.
*   </li>
*
*   <li>
*       <code>stream</code> &mdash; The {@link Stream} object. This object includes properties
*       defining the stream. This is undefined if there is an error.
*   </li>
*
* </ul>
*
* @method #getStream
* @memberof Session
*/
Session.prototype.getStream = function getStream(streamId, callback) {
  return this.ot.getStream(this.sessionId, streamId, callback);
};

/**
* Retrieves a List of {@link Stream} objects, representing current streams in the session.
*
* @param callback {Function} The function to call upon completing the operation. Two arguments
* are passed to the function:
*
* <ul>
*
*   <li>
*      <code>error</code> &mdash; An error object (if the call to the method fails). This is
*      set to null if there is no error.
*   </li>
*
*   <li>
*       <code>streams</code> &mdash; An array of {@link Stream} objects. Each Stream object
*       includes properties defining the stream. This is undefined if there is an error.
*   </li>
*
* </ul>
*
* @method #listStreams
* @memberof Session
*/
Session.prototype.listStreams = function listStreams(callback) {
  return this.ot.listStreams(this.sessionId, callback);
};

/**
* Sets the layout class list for streams in this session. Layout classes are used in
* the layout for composed archives and live streaming broadcasts. For more information, see
* <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">Customizing
* the video layout for composed archives</a> and
* <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/#configuring-video-layout-for-opentok-live-streaming-broadcasts">Configuring
* video layout for OpenTok live streaming broadcasts</a>.
*
* <p>
* You can set the initial layout class list for streams published by a client when you generate
* used by the client. See the {@link OpenTok#generateToken OpenTok.generateToken()} method.
*
* @param classListArray {Array} <p>(Optional) An array defining the class lists to apply to
* streams. Each element in the array is an object with two properties: <code>id</code> and
* <code>layoutClassList</code>. The <code>id</code> property is the stream ID (a String),
* and the <code>layoutClassList</code> is an array of class names (Strings) to apply to the
* stream. Set <code>layoutClassList</code> to an empty array to clear the layout class list for
* a stream. For example, this <code>streamClassArray</code> array sets the layout class list for
* three streams:
* <p>
* <pre>
* const classListArray = [
*   { id: '7b09ec3c-26f9-43d7-8197-f608f13d4fb6', layoutClassList: ['focus'] },
*   { id: '567bc941-6ea0-4c69-97fc-70a740b68976', layoutClassList: ['top'] },
*   { id: '307dc941-0450-4c09-975c-705740d08970', layoutClassList: ['bottom'] }
* ];
* </pre>
*
* @param callback {Function} The function to call upon completing the operation. Upon error,
* an <code>error</code> object is passed into the function. Upon success, the function is called
* with no error object passed in.
*
* @method #setStreamClassLists
* @memberof Session
*/
Session.prototype.setStreamClassLists = function setStreamClassLists(classListArray, callback) {
  return this.ot.setStreamClassLists(this.sessionId, classListArray, callback);
};

Session.prototype.generateToken = function generateToken(opts) {
  return this.ot.generateToken(this.sessionId, opts);
};

module.exports = Session;
