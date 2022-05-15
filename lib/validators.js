const { configuration } = require("./config");

// Taken from https://melvingeorge.me/blog/check-if-string-is-valid-ip-address-javascript
function checkIfValidIP(str) {
  // Regular expression to check if string is a IP address
  const regexExp =
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;

  return regexExp.test(str);
}

// - Authentication
// apiCheckKey: Checks to see if the client specified key matches.
function apiCheckKey(clientKey) {
  if (clientKey === configuration.Auth.communicationKey) return true;
  else return false;
}

// apiIsKeyFromRequestIsBad: The name is a mouthful, but checks if the key is bad.
function apiIsKeyFromRequestIsBad(req) {
  if (!req.body.serverKey || req.ip.serverKey !== configuration.Auth.communicationKey) {
    return true;
  } else {
    return false;
  }
}

// - Sanity Checking
// apiDoesServerExistByUuid: Checks if the server exists in our cache, by UUID.
function apiDoesServerExistByUuid(uuid, serverArray) {
  var doesExist = serverArray.filter((server) => server.uuid === uuid.trim());

  if (doesExist.length > 0) {
    return true;
  }

  // Fall though.
  return false;
}

// apiDoesServerExist: Checks if the server exists in our cache, by UUID.
function apiDoesServerExistByName(name, serverArray) {
  var doesExist = serverArray.filter((server) => server.name === name.trim());

  if (doesExist.length > 0) {
    return true;
  }

  // Fall though.
  return false;
}

// apiDoesThisServerExistByAddressPort: Checks if the server exists in our cache, by IP address and port.
function apiDoesThisServerExistByAddressPort(ipAddress, port, serverArray) {
  return (
    serverArray.filter((server) => server.ipAddress === ipAddress && server.port === +port).length >
    0
  );
}

// No post body check
function requestIncludesBody(req) {
  if (!req.body) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" denied from ${req.ip}: No POST body data?`,
      status: 400,
    };
  }
}

function accessControlCheck(req, useAccessControl, allowedServerAddresses) {
  if (useAccessControl && !allowedServerAddresses.includes(req.ip)) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" blocked from ${req.ip}. They are not known in our allowed IPs list.`,
      status: 403,
    };
  }
}

// Uuid provided but doesn't exist (/add).
function uuidProvidedButDoesNotExist(req, serverArray) {
  if (
    req.body.serverUuid &&
    !serverArray.filter((server) => server.uuid === req.body.serverUuid.trim()).length > 0
  )
    return {
      passed: false,
      logMessage: `Request to "${req.path}" from ${req.ip} denied: No such server with UUID '${req.body.serverUuid}'`,
      status: 400,
    };
}

// Server Name checking (/add)
function serverNameCheck(req, serverArray, allowDuplicateServerNames) {
  // Check to make sure the server name isn't null.
  if (!req.body.serverName) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server name is null/undefined.`,
      status: 400,
    };
  }

  // Check if we have duplicates and if they are allowed
  if (
    !allowDuplicateServerNames &&
    serverArray.some((server) => server.name === req.body.serverName.trim())
  ) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server name clashes with an existing server name.`,
      status: 400,
    };
  }
}

// Valid port provided?
function serverPortCheck(req) {
  // Now we need to check to ensure the server port isn't out of bounds.
  // Port 0 doesn't exist as per se, so we need to make sure we're valid.
  if (
    !req.body.serverPort ||
    isNaN(req.body.serverPort) ||
    req.body.serverPort < 1 ||
    req.body.serverPort > 65535
  ) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server port is undefined, below 1 or above 65335.`,
      status: 400,
    };
  }
}

function serverCollisionCheck(req, serverArray) {
  // Check if the server already exists.
  if (
    serverArray.some(
      (server) => server.ipAddress === req.ip && server.port === +req.body.serverPort
    )
  ) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server collision! We're attempting to add a server that's already known.`,
      status: 400,
    };
  }
}

// No server uuid provided
function serverUuidExists(req, serverArray) {
  if (!req.body.serverUuid) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" from ${req.ip} denied: No UUID provided`,
      status: 400,
    };
  }
  if (!apiDoesServerExistByUuid(req.body.serverUuid, serverArray)) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" from ${req.ip} denied: No such server with UUID '${req.body.serverUuid}'`,
      status: 400,
    };
  }
}

module.exports = {
  checkIfValidIP,
  apiCheckKey,
  apiIsKeyFromRequestIsBad,
  apiDoesServerExistByUuid,
  apiDoesServerExistByName,
  apiDoesThisServerExistByAddressPort,
  uuidProvidedButDoesNotExist,
  serverNameCheck,
  serverPortCheck,
  serverCollisionCheck,
  serverUuidExists,
  requestIncludesBody,
  accessControlCheck,
};
