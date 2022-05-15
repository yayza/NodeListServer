const uuid = require("uuid");

const { loggerInstance } = require("./logger");

// Functions used by NodeListServer
// - Utilities
// Generates a UUID for a newly added server.
function generateUuid(arr) {
  var generatedUuid = uuid.v4();
  var doesExist = arr.filter((server) => server.uuid === generatedUuid); // Used for collision check

  if (doesExist.length > 0) {
    generateUuid();
  }

  return generatedUuid;
}

// This function was coded on a whim and probably is jank. Improvements welcome,
// especially how to cast a string into a boolean. ie. "true" -> true.
// In C# I would do bool.TryParse or some other cast.
function translateConfigOptionToBool(value) {
  if (typeof value === "undefined" || value === "false") return false;
  // Thanks to https://medium.com/geekculture/20-javascript-snippets-to-code-like-a-pro-86f5fda5598e
  else return !!value;
}

// -- Request Handling
// denyRequest: Generic function that denies requests.
function denyRequest(req, res) {
  loggerInstance.warn(
    `Request from ${req.ip} denied. Tried ${req.method} method on path: ${req.path}`
  );
  return res.sendStatus(400);
}

// Automatically remove servers when they haven't updated after the time specified in the config.ini
function removeOldServers(arr) {
  loggerInstance.info("Removing old servers.");
  return arr.filter((freshServer) => freshServer.lastUpdated >= Date.now());
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  denyRequest,
  generateUuid,
  translateConfigOptionToBool,
  sleep,
  removeOldServers,
};
