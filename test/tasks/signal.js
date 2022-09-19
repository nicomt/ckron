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
