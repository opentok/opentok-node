<div align="center">
<a href="http://tokbox.com/">
<img src="https://swww.tokbox.com/img/img_www_platform_devices.jpg" style="margin: 0 auto;" alt="Open Tok" />
</a>
</div>

# OpenTokSDK for Node.js

OpenTok is a free set of APIs from TokBox that enables websites to weave live group video communication into their online experience. With OpenTok you have the freedom and flexibility to create the most engaging web experience for your users. OpenTok is currently available as a JavaScript and ActionScript 3.0 library. Check out <http://www.tokbox.com/> and <http://www.tokbox.com/opentok/tools/js/gettingstarted> for more information.

This is the OpenTok NodeJS Module.

* [Installation](#installation)
* [How to use](#how-to-use)
 * [Require the opentok module](#require-the-opentok-module)
 * [API key and API secret](#api-key-and-api-secret)
 * [OpenTokSDK](#opentoksdk)
 * [Creating Sessions](#creating-sessions)
 * [Generating Token](#generating-token)
 * [Downloading Archive Videos](#downloading-archive-videos)
 * [Get Archive Manifest](#get-archive-manifest)
 * [Get video ID](#get-video-id)
 * [Get Download URL](#get-download-url)
* [Example](#example)
* [Want to contribute?](#want-to-contribute)


## Installation

To install using npm, add OpenTok to `package.json` and run `npm install`:

```javascript
"dependencies" : {  
    "opentok" : "1.0.x",  
    ...
} 
```

To install as a regular npm package just type `npm install opentok`

## How to use

### Require the `opentok` module

Add the following code to the top of any file using the `opentok` module:

    var OpenTok = require('opentok');

### API key and API secret

Create an account at [TokBox](http://tokbox.com), and sign into your [Dashboard](https://dashboard.tokbox.com) for an API Key and Secret.

### OpenTokSDK

In order to use any of the server side functions, you must first create an `OpenTokSDK` object with your developer credentials.  
You must pass in your *API key* and *API secret*.

```javascript
var key = '';    // Replace with your API key  
var secret = '';  // Replace with your API secret  
var opentok = new OpenTok.OpenTokSDK(key, secret);
```

### Creating Sessions
Use your `OpenTokSDK` object to create a `session_id`.
`createSession` takes 2-3 parameters: 

 
#### Parameters 
| Name       | Description                                      | Type   | Optional |
| ---------- | ------------------------------------------------ | ------ | -------- |
| location   | Give OpenTok a hint of where the clients connecting will be located by specifiying an IP (e.g. '127.0.0.1') | string | yes |
| properties | Additional session options                       | object |   yes    |
| properties['p2p.preference'] | set to 'enabled' or 'disabled' | string |   yes    |
| callback   | This is a function that handles the server response after session has been created. The result sessionId is a string. |  fn(err, sessionId) |  no  |


Example: P2P disabled (default)

```javascript
var location = '127.0.0.1'; // use an IP or 'localhost'
var sessionId = '';
opentok.createSession(location, function(err, sessionId){
  if (err) return throw new Error("session creation failed");
  // Do things with sessionId
});
```

Example: P2P enabled

```javascript
var location = '127.0.0.1'; // use an IP of 'localhost'
var sessionId = '';
opentok.createSession(location, {'p2p.preference':'enabled'}, function(err, sessionId){
  if (err) return throw new Error("session creation failed");
  // Do things with sessionId
});
```

### Generating Token
With the generated session_id and an OpenTokSDK object, you can start generating tokens for each user.
`generateToken` takes in an object with 1-4 properties, and RETURNS a token as a string:

#### Parameters 

| Name            | Description                                                                                                          | Type   | Optional |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |:------:|:--------:|
| session_id      | This token is tied to the session it is generated with                                                               | string |  no      |
| role            | opentok.RoleConstants.{SUBSCRIBER&#124;PUBLISHER&#124;MODERATOR}. Publisher role used when omitted.                  | string |  yes     |
| expire_time     | Time when token will expire in unix timestamp.                                                                       | int    |  yes     |
| connection_data | Stores static metadata to pass to other users connected to the session. (eg. names, user id, etc)                    | string |  yes     |
 

Example:
<pre>
var token = opentok.generateToken({session_id:session_id, role:OpenTok.RoleConstants.PUBLISHER, connection_data:"userId:42"});
</pre>

### Downloading Archive Videos
To Download archived video, you must have an Archive ID (from the client), and a moderator token. For more information see <http://www.tokbox.com/opentok/api/tools/documentation/api/server_side_libraries.html#download_archive>.

#### Quick Overview of the javascript library: <http://www.tokbox.com/opentok/api/tools/js/documentation/api/Session.html#createArchive>
1. Create an event listener on `archiveCreated` event: `session.addEventListener('archiveCreated', archiveCreatedHandler);`  
2. Create an archive: `archive = session.createArchive(...);`  
3. When archive is successfully created `archiveCreatedHandler` would be triggered. An Archive object containing `archiveId` property is passed into your function. Save this in your database, this archiveId is what you use to reference the archive for playbacks and download videos  
4. After your archive has been created, you can start recording videos into it by calling `session.startRecording(archive)`  
 Optionally, you can also use the standalone archiving, which means that each archive would have only 1 video: <http://www.tokbox.com/opentok/api/tools/js/documentation/api/RecorderManager.html>

### Get Archive Manifest
With your **moderator token** and a OpenTokSDK object, you can generate a OpenTokArchive object, which contains information for all videos in the Archive  
`OpenTokSDK.getArchiveManifest()` takes in 3 parameters: **archiveId** and **moderator token**, and a callback function


#### Parameters
 
| Name            | Description                                                  | Type          | Optional |
| --------------- | ------------------------------------------------------------ | ------------- | -------- |
| archive_id      | Get this from the client that created the archive.           | string        |    no    |
| token           | Get this from the client or the generate_token method.       | string        |    no    |
| handler         | This function is triggered after it receives the Archive Manifest. The parameter  is an `OpenTokArchive` object. The *resources* property of this object is array of `OpenTokArchiveVideoResource` objects, and each `OpenTokArchiveVideoResource` object represents a video in the archive. | fn(tbarchive) |    no    | 


Example: (opentok is an OpentokSDK object)

```javascript
var token = 'moderator_token';
var archiveId = '5f74aee5-ab3f-421b-b124-ed2a698ee939'; // Obtained from Javascript Library

opentok.getArchiveManifest(archiveId, token, function(tbarchive){
  var otArchive = tbarchive;
});
```

### Get video ID
`OpenTokArchive.resources` is an array of `OpenTokArchiveVideoResource` objects. OpenTokArchiveVideoResource has a `getId()` method that returns the videoId as a string.

Example:
```javascript
opentok.getArchiveManifest(archiveId, token, function(tbarchive){
  var vidID = tbarchive.resources[0].getId();
});
```

### Get Download URL
`OpenTokArchive` objects have a `downloadArchiveURL(video_id, handler)` method that will return a URL string for downloading the video in the archive. Video files are FLV format.


#### Parameters

| Name            | Description                                                  | Type          | Optional |
| --------------- |------------------------------------------------------------- | ------------- | -------- |
| video_id        | The Video ID returned from OpenTokArchiveVideoResource.getId() | string      |    no    |
| handler         | This function is triggered after it receives the URL for video. The result is a URL string. | [fn(url)] | no |

Example:

```javascript
var url = '';
otArchive.downloadArchiveURL(vidID, function(resp){
  url = resp;
});
```


## Example

  Check out the basic working example in examples/app.js

### When done, update package.json version number and publish npm

    npm publish

## Want to contribute?
### To run test suite:
    jasmine-node --coffee spec/


