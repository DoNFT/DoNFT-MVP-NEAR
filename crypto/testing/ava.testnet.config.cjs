module.exports = {
  ...require('near-workspaces-ava/ava.testnet.config.cjs'),
  ...require('./ava.config.cjs'),
};

// Add files you only want to run in Sandbox mode here
module.exports.files.push(
  // '!__tests__/example-file-name*',
  // '!__tests__/another-example-file-name*',
);

module.exports.environmentVariables = {
  TESTNET_MASTER_ACCOUNT_ID: 'near_testy.testnet',
};