/*
 * helpers
 */

/**
 * sends errors to callback functions in pretty, readable messages
 * @param   {Object}                    details
 * @param   {string}                    details.action - the action whose error needs handling
 * @param   {Error}                     [details.cause] - an underlying error that caused the error
 * @param   {OpenTokSDK~errorCallback}  cb
 */
function handleError(details, cb) {
  var message;

  // Construct message according the the action (or method) that is triggering the error
  if (details.action === 'createSession') {
    message = 'Failed to create new OpenTok Session using properties: ' + JSON.stringify(details.props) + '.\n';
  } else if (details.action === 'loadManifest') {
    message = 'Failed to load the archive manifest for archiveId: ' + details.archiveId + '.\n';
  }

  // When there is an underlying error that caused this one, give some details about it
  if (details.cause) {
    message += 'This error was caused by another error: "' + details.cause.message + '".\n';
  }

  return cb(new Error(message));
};

exports.handleError = handleError;
