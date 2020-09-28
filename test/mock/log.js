/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
class MockLog {
  info(message) {}
  warning(message) {}
  debug(message) {}
  error(message, err) {}
  pushNamespace(name) {}
  popNamespace() {}
}

module.exports = MockLog;
