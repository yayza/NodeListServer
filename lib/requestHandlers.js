const validate = require("./validators");
const loggerInstance = require("./logger");
const { configuration, translateConfigOptionToBool } = require("./config");

// This only runs if the request results in an error
// (prevents stack trace from being displayed to user)
function handleErrors(err, req, res, next) {
  // Handle invalid JSON requests.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    loggerInstance.info(`${req.ip} sent a bad request: '${err}'`);
    return res.status(400).send({ message: "Invalid JSON request" });
  }
  next(); // Continue
}

// Our gatekeeper: Any request must pass it's tests before being allowed to continue.
function globalValidations(req, res, next) {
  // An array of the entry checks to perform
  const barrier = [
    ["/list", "/add", "/remove"].includes(req.path), // Only allow these paths
    req.body.serverKey, // Must have a server key
    req.body.serverKey === configuration.Auth.communicationKey, // Must be the correct key
  ];

  // If any of the above initial checks are false, we deny request.
  if (barrier.some((v) => v == false)) return res.status(401).send("Unauthorized");

  next();
}

// If you want to specify validators for a specific path, add them here.
function pathSpecificValidations(req, res, next, knownServers, allowedServerAddresses) {
  // - Validations that occur on both "/add" and "/remove"
  if (req.path === "/add" || req.path === "/remove") {
    // Lets assign this to a variable for easier reading.
    const useAccessControl = translateConfigOptionToBool(configuration.Auth.useAccessControl);
    // Put all the validators we want to check in an array
    const validations = [
      validate.accessControlCheck(req, useAccessControl, allowedServerAddresses),
      validate.requestIncludesBody(req),
    ];
    // Now we check them, this returns the first error message it finds, or undefined if none.
    const failed = validations.find((v) => v?.passed === false);
    if (failed) {
      loggerInstance.warn(failed.logMessage);
      return res.sendStatus(failed.status);
    }

    // - Validations specific to "/add" path
    if (req.path == "/add") {
      const allowDuplicateServerNames = translateConfigOptionToBool(
        configuration.Security.allowDuplicateServerNames
      );

      const validations = [
        validate.uuidProvidedButDoesNotExist(req, knownServers),
        validate.serverNameCheck(req, knownServers, allowDuplicateServerNames),
        validate.serverPortCheck(req),
        validate.serverCollisionCheck(req, knownServers),
      ];

      const failed = validations.find((v) => v?.passed === false);
      if (failed) {
        loggerInstance.warn(failed.logMessage);
        return res.sendStatus(failed.status);
      }
    }

    // - Validations specific to "/remove" path
    if (req.path == "/remove") {
      const validations = [validate.serverUuidExists(req, knownServers)];
      console.log(validations);
      const failed = validations.find((v) => v?.passed === false);
      if (failed) {
        loggerInstance.warn(failed.logMessage);
        return res.sendStatus(failed.status);
      }
    }
  }
  next();
}

module.exports = { handleErrors, globalValidations, pathSpecificValidations };
