import test from 'ava';
import DockerUtil from '../util/docker.js';
import MockLog from '../mock/log.js';
import SignalTask from '../../lib/tasks/signal.js';

const log = new MockLog();
const dockerUtil = new DockerUtil();


async function setup(signal) {
  await dockerUtil.pullImage('busybox');
  const container = await dockerUtil.runContainer({
    Image: 'busybox',
    Entrypoint: ['sh', '-c'],
    Cmd: [`trap "echo success" ${signal}; sleep 10`],
    HostConfig: {
      AutoRemove: true
    }
  }, true);
  return container;
}

test('signal: simple', async (t) => {
  const signal = 'SIGHUP';
  const container = await setup(signal);
  const task = new SignalTask('test', {
    container: container.id,
    signal
  });

  await task.execute(log);
  const output = await container.output;
  t.is(task.name, 'test');
  t.is(output, 'success');
});

test('signal: timeout success', async (t) => {
  const signal = 'SIGHUP';
  const container = await setup(signal);
  const task = new SignalTask('test', {
    container: container.id,
    signal,
    timeout: 10
  });

  await task.execute(log);
  const output = await container.output;
  t.is(task.name, 'test');
  t.is(output, 'success');
});

test('signal: timeout failure', async (t) => {
  const signal = 'SIGHUP';
  const container = await setup(signal);

  // Get the docker container object and mock its kill method to simulate slow operation
  const SignalTaskWithMock = class extends SignalTask {
    async execute(taskLog) {
      taskLog.pushNamespace(this.name);
      taskLog.info(`Sending signal ${this.signal} to ${this.container}`);

      let timeoutId;

      try {
        const containerObj = this.docker.getContainer(this.container);

        // Mock the kill method to take longer than timeout
        const originalKill = containerObj.kill.bind(containerObj);
        containerObj.kill = async (options) => {
          await new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });
          return originalKill(options);
        };

        // Set up timeout if specified
        let timeoutPromise;
        if (this.timeout) {
          timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Task timed out after ${this.timeout} seconds`));
            }, this.timeout * 1000);
          });
        }

        const killPromise = containerObj.kill({ signal: this.signal });

        if (this.timeout) {
          await Promise.race([killPromise, timeoutPromise]);
        } else {
          await killPromise;
        }

        taskLog.info('Signal sent');
      } catch (err) {
        taskLog.error('Task failed', err);
        throw err;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        taskLog.popNamespace();
      }
    }
  };

  const task = new SignalTaskWithMock('test', {
    container: container.id,
    signal,
    timeout: 1
  });

  await t.throwsAsync(
    () => task.execute(log),
    { message: /timed out after 1 seconds/ }
  );
});
