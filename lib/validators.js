const { configuration } = require("./config");
const { loggerInstance } = require("./logger");

// - Authentication
// apiCheckKey: Checks to see if the client specified key matches.
function apiCheckKey(clientKey) {
  if (clientKey === configuration.Auth.communicationKey) return true;
  else return false;
}

// apiIsKeyFromRequestIsBad: The name is a mouthful, but checks if the key is bad.
function apiIsKeyFromRequestIsBad(req) {
  if (typeof req.body.serverKey === "undefined" || !apiCheckKey(req.body.serverKey)) {
    loggerInstance.warn(`${req.ip} used a wrong key: ${req.body.serverKey}`);
    return true;
  } else {
    return false;
  }
}

// - Sanity Checking
// apiDoesServerExistByUuid: Checks if the server exists in our cache, by UUID.
function apiDoesServerExistByUuid(uuid, arr) {
  var doesExist = arr.filter((server) => server.uuid === uuid.trim());

  if (doesExist.length > 0) {
    return true;
  }

  // Fall though.
  return false;
}

// apiDoesServerExist: Checks if the server exists in our cache, by UUID.
function apiDoesServerExistByName(name, arr) {
  var doesExist = arr.filter((server) => server.name === name.trim());

  if (doesExist.length > 0) {
    return true;
  }

  // Fall though.
  return false;
}

// apiDoesThisServerExistByAddressPort: Checks if the server exists in our cache, by IP address and port.
function apiDoesThisServerExistByAddressPort(ipAddress, port, arr) {
  return arr.filter((servers) => servers.ip === ipAddress.trim() && servers.port === +port).length;
}

// Taken from https://melvingeorge.me/blog/check-if-string-is-valid-ip-address-javascript
function checkIfValidIP(str) {
  // Regular expression to check if string is a IP address
  const regexExp =
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;

  return regexExp.test(str);
}

module.exports = {
  apiCheckKey,
  apiIsKeyFromRequestIsBad,
  apiDoesServerExistByUuid,
  apiDoesServerExistByName,
  apiDoesThisServerExistByAddressPort,
  checkIfValidIP,
};
