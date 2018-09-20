/* global require, exports */
/* jshint strict:false, eqnull:true */

/**
* An object representing an OpenTok live streaming broadcast.
* <p>
* Do not call the <code>new()</code> constructor. To start a live streaming broadcast, call the
* {@link OpenTok#startBroadcast OpenTok.startBroadcast()} method.
*
* @property {Number} createdAt
*   The time at which the archive was created, in milliseconds since the UNIX epoch.
*
* @see {@link OpenTok#getBroadcast OpenTok.getBroadcast()}
* @see {@link OpenTok#startBroadcast OpenTok.startBroadcast()}
* @see {@link OpenTok#stopBroadcast OpenTok.stopBroadcast()}
*
* @class Broadcast
*/
var Broadcast = function Broadcast(client, json) {
  var properties = JSON.parse(json);
  var hasProp = {}.hasOwnProperty;
  var id = properties.id;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key) && key !== 'event' && key !== 'partnerId') {
      this[key] = properties[key];
    }
  }

  /**
  * Stops the live streaming broadcast.
  * <p>
  * Archives automatically stop recording after 120 minutes or when all clients have disconnected
  * from the session being archived.
  *
  * @param callback {Function} The function to call upon completing the operation. Two arguments
  * are passed to the function:
  *
  * <ul>
  *
  *   <li>
  *      <code>error</code> &mdash; An error object (if the call to the method fails).
  *   </li>
  *
  *   <li>
  *       <code>broadcast</code> &mdash; The Broadcast object.
  *   </li>
  *
  * </ul>
  *
  * @method #stop
  * @memberof Broadcast
  */
  this.stop = function (callback) {
    client.stopBroadcast(id, function (err, response) {
      if (err) {
        return callback(new Error('Failed to stop broadcast. ' + err));
      }
      return callback(null, new Broadcast(client, response));
    });
  };
};

module.exports = Broadcast;

