import Docker from 'dockerode';

class SignalTask {
  constructor(name, { container, signal, timeout }) {
    this.name = name;
    this.container = container;
    this.signal = signal;
    this.timeout = timeout;
    this.docker = new Docker();
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info(`Sending signal ${this.signal} to ${this.container}`);

    let timeoutId;

    try {
      const container = this.docker.getContainer(this.container);

      // Set up timeout if specified
      let timeoutPromise;
      if (this.timeout) {
        timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Task timed out after ${this.timeout} seconds`));
          }, this.timeout * 1000);
        });
      }

      const killPromise = container.kill({ signal: this.signal });

      if (this.timeout) {
        await Promise.race([killPromise, timeoutPromise]);
      } else {
        await killPromise;
      }

      log.info('Signal sent');
    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      log.popNamespace();
    }
  }
}

export default SignalTask;
