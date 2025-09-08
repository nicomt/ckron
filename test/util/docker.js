import { resolve } from 'path';
import { PassThrough } from 'stream';
import * as url from 'url';
import Docker from 'dockerode';
import streamToString from 'stream-to-string';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

class DockerUtil {
  constructor() {
    this.docker = new Docker();
  }

  async getImage(name) {
    const localImages = await this.docker.listImages({
      filters: { reference: [name] }
    });

    if (localImages.length > 0) {
      const [imageDesc] = localImages;
      return this.docker.getImage(imageDesc.Id);
    }

    return null;
  }

  async removeImage(name, options) {
    const image = await this.getImage(name);
    if (image) {
      await image.remove(options);
    }
  }

  async pullImage(name) {
    const stream = await this.docker.pull(name);
    await new Promise((res, rej) => {
      this.docker.modem.followProgress(stream, (err) => {
        if (err) return rej(err);
        return res();
      });
    });
  }

  async pushImage(name, authConfig) {
    const image = this.docker.getImage(name);
    const pushStream = await image.push({ authconfig: authConfig });
    await new Promise((res, rej) => {
      this.docker.modem.followProgress(pushStream, (err, output) => {
        if (err) return rej(err);
        if (output) {
          const errors = output.filter(line => line.error);
          if (errors.length > 0) {
            return rej(new Error(errors[0].error));
          }
        }
        return res();
      });
    });
  }

  async containerExists(id) {
    const containers = await this.docker.listContainers({
      all: true,
      filters: { id: [id] }
    });
    return containers.length > 0;
  }

  async removeContainer(id) {
    const container = this.docker.getContainer(id);
    await container.remove();
  }

  async runContainer(opt, attach = false) {
    const container = await this.docker.createContainer(opt);
    await container.start();
    if (attach) {
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true
      });
      const through = new PassThrough();
      stream.on('end', () => through.end());
      this.docker.modem.demuxStream(stream, through, through);
      container.output = streamToString(through).then(s => s.trim());
    }
    return container;
  }

  async setupTestRegistry(port = '5004') {
    // Pull required images
    await this.pullImage('registry:3');
    await this.pullImage('caddy:2');
    await this.pullImage('busybox');

    const caddyfilePath = resolve(__dirname, '../fixtures/registry/Caddyfile');

    // Create a custom network for the containers
    let network;
    try {
      network = await this.docker.createNetwork({
        Name: 'ckron-test-registry-network',
        Driver: 'bridge'
      });
    } catch (err) {
      if (err.statusCode !== 409) { // 409 = already exists
        throw err;
      }
      network = this.docker.getNetwork('ckron-test-registry-network');
    }

    // Start the registry container
    const registryContainer = await this.docker.createContainer({
      Image: 'registry:3',
      name: 'ckron-test-registry',
      ExposedPorts: { '5000/tcp': {} },
      HostConfig: {
        AutoRemove: true
      },
      NetworkingConfig: {
        EndpointsConfig: {
          'ckron-test-registry-network': {
            Aliases: ['registry']
          }
        }
      }
    });

    // Start the Caddy proxy container with authentication
    const caddyContainer = await this.docker.createContainer({
      Image: 'caddy:2',
      name: 'ckron-test-caddy',
      ExposedPorts: { '5080/tcp': {} },
      HostConfig: {
        PortBindings: { '5080/tcp': [{ HostPort: port }] },
        Binds: [
          `${caddyfilePath}:/etc/caddy/Caddyfile:ro`
        ],
        AutoRemove: true
      },
      NetworkingConfig: {
        EndpointsConfig: {
          'ckron-test-registry-network': {}
        }
      }
    });

    await registryContainer.start();
    await caddyContainer.start();

    const registryHost = `localhost:${port}`;
    await DockerUtil.waitForServer(
      `http://${registryHost}/v2/`,
      { Authorization: `Basic ${Buffer.from('testuser:testpassword').toString('base64')}` }
    );

    return {
      registryHost,
      authconfig: {
        username: 'testuser',
        password: 'testpassword',
        serveraddress: registryHost
      },
      network,
      registryContainer,
      caddyContainer
    };
  }

  static async teardownTestRegistry({ network, registryContainer, caddyContainer }) {
    // Clean up containers and network
    await Promise.all([
      caddyContainer.stop({ force: true }).catch(() => {}),
      registryContainer.stop({ force: true }).catch(() => {}),
    ]);

    await network.remove({ force: true }).catch(() => {});
  }

  static async waitForServer(serverUrl, headers = {}, timeoutMs = 30000, intervalMs = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(serverUrl, { headers });
        if (res.status === 200) return true;
      } catch {
        // Ignore errors and retry
      }
      await new Promise((resolve) => { setTimeout(resolve, intervalMs); });
    }
    throw new Error('Server did not become available in time');
  }

}

export default DockerUtil;
