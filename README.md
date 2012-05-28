# OpenTokSDK for Node.js

OpenTok is a free set of APIs from TokBox that enables websites to weave live group video communication into their online experience. With OpenTok you have the freedom and flexibility to create the most engaging web experience for your users. OpenTok is currently available as a JavaScript and ActionScript 3.0 library. Check out <http://www.tokbox.com/> and <http://www.tokbox.com/opentok/tools/js/gettingstarted> for more information.

This is the official OpenTok NodeJS Module.

## Installation

To install using npm, add OpenTok to `package.json` and run `npm install`:
<pre>
"dependencies" : {  
    "opentok" : ">= 0.2.0",  
    ...
} 
</pre>

To install as a regular npm package just type `npm install opentok`

## How to use

### API-key and secret

Request your api-key and secret at <http://www.tokbox.com/opentok/tools/js/apikey>. You can use the staging environment for testing. The gem uses this staging environment by default.

### OpenTokSDK

In order to use any of the server side functions, you must first create an `OpenTokSDK` object with your developer credentials.  
You must pass in your *Key* and *Secret*. If your app is in production, you must also pass in a object containing `API_URL` property  
For more information about production apps, check out <http://www.tokbox.com/opentok/api/tools/js/launch>

Example: ( Staging )
<pre>
key = ''    # Replace with your key  
secret = ''  # Replace with your secret  
opentok = new OpenTok.OpenTokSDK(key, secret)  
</pre>

Example: ( Production )
<pre>
opentok = new OpenTok.OpenTokSDK(key, secret, {API_URL:'https://api.opentok.com/hl'})  
</pre>

### Creating Sessions
Use your `OpenTokSDK` object to create `session_id`  
`create_session` takes 2-3 parameters:  
> location (string) -  give Opentok a hint on where you are running your application  
> properties (object) - OPTIONAL. Set peer to peer as `enabled` or `disabled`  
> callback (sessionId) - This is a function that handles the server response after session has been created  

Example: P2P disabled by default
<pre>
location = 'localhost'
sessionId = ''
opentok.create_session(location, function(result){
  sessionId = result;
});
</pre>

Example: P2P enabled
<pre>
location = 'localhost'
sessionId = ''
opentok.create_session(location, {'p2p.preference':'enabled'}, function(result){
  sessionId = result;
});
</pre>

### Generating Token
With the generated session_id and an OpenTokSDK object, you can start generating tokens for each user.  
`generate_token` takes in an object with 1-4 properties, and RETURNS a token:  
> session_id (string) - REQUIRED. This token is tied to the session it is generated with  
> role (string) - OPTIONAL. subscriber, publisher, or moderator  
> expire_time (int) - OPTIONAL. Time when token will expire in unix timestamp  
> connection_data (string) - OPTIONAL. Stores metadata to pass to other users connected to the session. (names, user id, etc)  

Example:
<pre>
token = opentok.generate_token({sessionId:session_id, role:OpenTok.RoleConstants.PUBLISHER, connection_data:"hello"})
</pre>

### Downloading Archive Videos
To Download archived video, you must have an Archive ID which you get from the javascript library

#### Quick Overview of the javascript library: <http://www.tokbox.com/opentok/api/tools/js/documentation/api/Session.html#createArchive>
1. Create an event listener on `archiveCreated` event: `session.addEventListener('archiveCreated', archiveCreatedHandler);`  
2. Create an archive: `archive = session.createArchive(...);`  
3. When archive is successfully created `archiveCreatedHandler` would be triggered. An Archive object containing `archiveId` property is passed into your function. Save this in your database, this archiveId is what you use to reference the archive for playbacks and download videos  
4. After your archive has been created, you can start recording videos into it by calling `session.startRecording(archive)`  
 Optionally, you can also use the standalone archiving, which means that each archive would have only 1 video: <http://www.tokbox.com/opentok/api/tools/js/documentation/api/RecorderManager.html>

### Get Archive Manifest
With your **moderator token** and OpentokSDK Object, you can generate OpenTokArchive Object, which contains information for all videos in the Archive  
`get_archive_manifest()` takes in 3 parameters: **archiveId** and **moderator token**, and a handler function
> archive_id (string) - REQUIRED. 
> token - REQUIRED.  
> handler (tbarchive) - REQUIRED. This function is triggered after it receives the Archive Manifest. The parameter is an `OpenTokArchive` object. The *resources* property of this object is array of `OpenTokArchiveVideoResource` objects, and each `OpenTokArchiveVideoResource` object represents a video in the archive.

Example:(Make sure you have the OpentokSDK Object)
<pre>
token = 'moderator_token'
archiveId = '5f74aee5-ab3f-421b-b124-ed2a698ee939' #Obtained from Javascript Library

opentok.get_archive_manifest(archiveId, token, function(tbarchive){
  otArchive = tbarchive
});
</pre>

### Get video ID
`OpenTokArchive.resources` is an array of `OpenTokArchiveVideoResource` objects. OpenTokArchiveVideoResource has `getId()` method that returns the videoId
`getId()` will return the video ID (a String)

Example:
<pre>
opentok.get_archive_manifest(archiveId, token, function(tbarchive){
  vid1 = tbarchive.resources[0].getId()
});
</pre>

### Get Download Url
`OpenTokArchive` has `downloadArchiveURL` that will return an url string for downloading the video in the archive. Video files are FLV format  
> video_id (string) - REQUIRED  
> handler (url) - REQUIRED. This function is triggered after it receives the url for video. The parameter is an url string  

Example:
<pre>
url = "";
otArchive.downloadArchiveURL(vid, function(resp){
  url = resp;
});
</pre>


## Example

  Check out the basic working example in examples/app.js


## Want to contribute?
### To run test suite:
    jasmine-node --coffee --autotest spec/


