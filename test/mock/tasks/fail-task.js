/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */

class MockFailTask {
  constructor(name, message = 'expected fail') {
    this.name = name;
    this.message = message;
    this.executionTimes = 0;
  }

  async execute(log) {
    this.executionTimes++;
    throw new Error(this.message);
  }
}

module.exports = MockFailTask;
