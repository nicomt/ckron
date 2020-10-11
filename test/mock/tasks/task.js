/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */

class MockTask {
  constructor(name) {
    this.name = name;
    this.executionTimes = 0;
  }

  async execute(log) {
    this.executionTimes++;
    return { name: this.name, output: 'success' };
  }
}

module.exports = MockTask;
