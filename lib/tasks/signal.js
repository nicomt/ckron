const Docker = require('dockerode');

class SignalTask {
  constructor(name, { container, signal }) {
    this.name = name;
    this.container = container;
    this.signal = signal;
    this.docker = new Docker();
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info(`Sending signal ${this.signal} to ${this.container}`);

    try {
      const container = this.docker.getContainer(this.container);
      await container.kill({ signal: this.signal });
      log.info('Signal sent');
    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      log.popNamespace();
    }
  }
}

module.exports = SignalTask;
