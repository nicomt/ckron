/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */

class MockFailTask {
  constructor(name) {
    this.name = name;
    this.executionTimes = 0;
  }

  async execute(log) {
    this.executionTimes++;
    throw new Error('expected fail');
  }
}

module.exports = MockFailTask;
