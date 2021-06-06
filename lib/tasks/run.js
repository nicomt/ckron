
const path = require('path');
const { promises: fs } = require('fs');
const Docker = require('dockerode');
const gitignoreParser = require('gitignore-parser');
const util = require('../util');

class RunTask {
  constructor(name, {
    image,
    build,
    command,
    user,
    working_dir: workingDir,
    volumes, environment,
    network,
    update,
    pull = 'missing', // Deprecated: use update
    auto_remove: autoRemove = true
  }) {
    this.name = name;
    this.image = image;
    this.build = build;
    this.command = command ? util.parseCommand(command) : [];
    this.user = user;
    this.workingDir = workingDir;
    this.volumes = volumes;

    if (environment) this.environment = util.parseEnvironment(environment);
    this.network = network;
    this.pullWhen = update || pull;
    this.buildWhen = update || 'missing';
    this.autoRemove = autoRemove;
    this.docker = new Docker();
    this.lastPull = 0;
    this.lastBuild = 0;
  }


  async imageExists(image) {
    const localImages = await this.docker.listImages({
      filters: { reference: [image] }
    });
    return localImages.length > 0;
  }

  async checkOrBuild(log, image) {
    if (this.buildWhen === 'never') return;

    if (this.buildWhen === 'always' || !(await this.imageExists(image))) {
      const context = typeof this.build === 'string' ? this.build : this.build.context;
      log.info(`Building ${image} from context ${context}`);
      let filter;
      try {
        const dockerIgnore = await fs.readFile(path.join(context, '.dockerignore'), 'utf8');
        const gitignore = gitignoreParser.compile(dockerIgnore);
        filter = f => gitignore.accepts(f);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
      const opt = { t: image };
      if (this.build.dockerfile) {
        opt.dockerfile = this.build.dockerfile;
      }
      if (this.build.args) {
        opt.buildargs = util.parseArgs(this.build.args);
      }

      const files = await util.getFiles(context, filter);
      const src = files
        .map(path.relative.bind(null, context))
        .filter(filter);
      const stream = await this.docker.buildImage({
        context,
        src
      }, opt);
      await new Promise((res, rej) => {
        this.docker.modem.followProgress(stream, (err) => {
          if (err) return rej(err);
          return res();
        });
      });
      this.lastBuild = Date.now();
    }
  }

  async checkOrPull(log) {
    if (this.pullWhen === 'never') return;

    if (this.pullWhen === 'always' || !(await this.imageExists(this.image))) {
      log.info(`Pulling ${this.image} from registry`);
      const stream = await this.docker.pull(this.image);
      await new Promise((res, rej) => {
        this.docker.modem.followProgress(stream, (err) => {
          if (err) return rej(err);
          return res();
        });
      });
      this.lastPull = Date.now();
    }
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');
    try {
      const image = this.image || `${this.name}_ckron_task`;
      if (this.build) {
        await this.checkOrBuild(log, image);
      } else {
        await this.checkOrPull(log);
      }

      const opt = {
        User: this.user,
        WorkingDir: this.workingDir,
        HostConfig: {
          AutoRemove: this.autoRemove
        }
      };

      if (this.environment) opt.Env = this.environment;
      if (this.volumes) opt.HostConfig.Binds = this.volumes;

      const bufferStream = util.buildOutputBufferStream();
      const [res, container] = await this.docker.run(image, this.command, bufferStream.stream, opt);

      const { Error: error, StatusCode: exitCode } = res;
      const output = bufferStream.buffer.trim();
      const containerId = container.id;

      if (error) throw error;
      if (exitCode !== 0) {
        throw new Error(`${this.name} exited with exit code: ${exitCode} - output:\n${output}`);
      }

      log.info(`Task done - output:\n${output}`);
      return { exitCode, output, containerId };
    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      log.popNamespace();
    }
  }
}

module.exports = RunTask;
