// ---------------
// Used to store our configuration file data.
// ---------------
const loggerInstance = require("./logger");
const iniParser = require("multi-ini");
const fs = require("fs");
var configuration;

// Do we have a configuration file?
if (fs.existsSync("config.ini")) {
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

// This function was coded on a whim and probably is jank. Improvements welcome,
// especially how to cast a string into a boolean. ie. "true" -> true.
// In C# I would do bool.TryParse or some other cast.
function translateConfigOptionToBool(value) {
  if (typeof value === "undefined" || value === "false") return false;
  // Thanks to https://medium.com/geekculture/20-javascript-snippets-to-code-like-a-pro-86f5fda5598e
  else return !!value;
}

module.exports = { configuration, translateConfigOptionToBool };
