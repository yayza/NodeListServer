const expressServer = require("express");
const expressApp = expressServer();

const { configuration } = require("./config");
const { translateConfigOptionToBool } = require("./helpers");
const { loggerInstance } = require("./logger");

// - Rate Limiter
// Note: We check if this is undefined as well as set to true, because we may be
// using an old configuration ini file that doesn't have the new setting in it.
// Enabled by default, unless explicitly disabled.
if (
  typeof configuration.Security.useRateLimiter === "undefined" ||
  translateConfigOptionToBool(configuration.Security.useRateLimiter)
) {
  const expressRateLimiter = require("express-rate-limit");
  const limiter = expressRateLimiter({
    windowMs: configuration.Security.rateLimiterWindowMs,
    max: configuration.Security.rateLimiterMaxApiRequestsPerWindow,
  });

  console.log("Security: Enabling the rate limiter module.");
  expressApp.use(limiter);
}

// Make sure we use some other things too.
expressApp.use(expressServer.json());
expressApp.use(expressServer.urlencoded({ extended: true }));
expressApp.use((err, req, res, next) => {
  // Handle invalid JSON requests.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    loggerInstance.info(`${req.ip} sent a bad request: '${err}'`);
    return res.status(400).send({ message: "Bad Request Body" });
  }
  next(); // Continue
});

module.exports = { expressApp };
