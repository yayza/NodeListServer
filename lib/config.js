const fs = require("fs");
const iniParser = require("multi-ini");

const { loggerInstance } = require("./logger");

// ---------------
// Used to store our configuration file data.
// ---------------
var configuration;

// Do we have a configuration file?
if (fs.existsSync("./config.ini")) {
  configuration = iniParser.read("./config.ini");
  // Use only for checking if configuration is valid, and not in production.
  // console.log(configuration);
} else {
  loggerInstance.error("NodeListServer failed to start due to a missing 'config.ini' file.");
  loggerInstance.error("Please ensure one exists in the directory next to the script file.");
  loggerInstance.error(
    "If you see this message repeatedly, you might have found a bug worth reporting at https://github.com/SoftwareGuy/NodeListServer."
  );
  loggerInstance.error("Exiting...");
  process.exit(1);
}

module.exports = { configuration };
