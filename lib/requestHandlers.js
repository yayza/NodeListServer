const validate = require("./validators");
const loggerInstance = require("./logger");
const { configuration, translateConfigOptionToBool } = require("./config");

// This only runs if there's an error in the request.
// Prevents showing the stack trace to the user
function handleErrors(err, req, res, next) {
  // Handle invalid JSON requests.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    loggerInstance.info(`${req.ip} sent a bad request: '${err}'`);
    return res.status(400).send({ message: "Invalid JSON request" });
  }
  next(); // Continue
}

// This checks requests before they get passed on to other functions
function handleValidations(req, res, next, knownServers, allowedServerAddresses) {
  // An array of the general checks to perform
  const barrier = [
    ["/list", "/add", "/remove"].includes(req.path),
    req.body.serverKey,
    req.body.serverKey === configuration.Auth.communicationKey,
  ];

  // If any of the above error checks are false, we deny request.
  if (barrier.some((v) => v == false)) return res.status(401).send("Unauthorized");

  // Path specific checks to perform
  if (req.path === "/add" || req.path === "/remove") {
    // Lets assign this to a variable for easier reading.
    const useAccessControl = translateConfigOptionToBool(configuration.Auth.useAccessControl);

    // Put all the validators we want to check in an array
    const validations = [
      validate.accessControlCheck(req, useAccessControl, allowedServerAddresses),
      validate.requestIncludesBody(req),
    ];

    // Now we check them, this returns the first error message, or undefined if none.
    const failed = validations.find((v) => v?.passed === false);
    if (failed) {
      loggerInstance.warn(failed.logMessage);
      return res.sendStatus(failed.status);
    }

    // Validations specific to "/add"
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

      // Same as before
      const failed = validations.find((v) => v?.passed === false);
      if (failed) {
        loggerInstance.warn(failed.logMessage);
        return res.sendStatus(failed.status);
      }
    }

    // Validations specific to "/remove"
    if (req.path == "/remove") {
      const singleCheck = validate.serverUuidExists(req, knownServers);
      if (singleCheck?.passed == false) {
        loggerInstance.warn(singleCheck.logMessage);
        return res.sendStatus(singleCheck.status);
      }
    }
  }

  next();
}

module.exports = { handleErrors, handleValidations };
