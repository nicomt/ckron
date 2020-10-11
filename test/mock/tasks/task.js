/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */

class MockTask {
  constructor(name, output = 'success') {
    this.name = name;
    this.output = output;
    this.executionTimes = 0;
  }

  async execute(log) {
    this.executionTimes++;
    return { name: this.name, output: this.output };
  }
}

module.exports = MockTask;
