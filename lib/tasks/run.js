/* eslint-disable camelcase */
const Docker = require('dockerode');
const util = require('../util');

class RunTask {
  constructor(name, { image, command, volumes, environment, network, pull = 'missing', auto_remove = true }) {
    this.name = name;
    this.image = image;
    this.command = util.parseCommand(command);
    this.volumes = volumes;
    if (environment) this.environment = util.parseEnvironment(environment);
    this.network = network;
    this.pull = pull;
    this.autoRemove = auto_remove;
    this.docker = new Docker();
  }

  async imageExists(image) {
    const localImages = await this.docker.listImages({
      filters: { reference: [image] }
    });

    return localImages.length > 0;
  }
  async checkOrPull(image, log) {
    if (this.pull === 'never') return;

    if (this.pull === 'always' || !(await this.imageExists(image))) {
      log.info(`Pulling ${image} from registry`);
      const stream = await this.docker.pull(image);
      await new Promise((res) => {
        this.docker.modem.followProgress(stream, res);
      });
    }
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');
    try {

      const bufferStream = util.buildBufferStream();
      await this.checkOrPull(this.image, log);
      const opt = {
        HostConfig: {
          AutoRemove: this.autoRemove
        }
      };

      if (this.environment) opt.Env = this.environment;
      if (this.volumes) opt.HostConfig.Binds = this.volumes;

      const [res] = await this.docker.run(this.image, this.command, bufferStream.stream, opt);

      const { Error: error, StatusCode: exitCode } = res;
      const output = bufferStream.buffer.trim();

      if (error) throw error;
      if (exitCode !== 0) {
        throw new Error(`${this.name} exited with exit code: ${exitCode} - output:\n${output}`);
      }

      log.info(`Task done - output:\n${output}`);

    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      log.popNamespace();
    }
  }
}

module.exports = RunTask;
