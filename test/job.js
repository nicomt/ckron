import test from 'ava';
import MockTask from './mock/tasks/task.js';
import MockFailTask from './mock/tasks/fail-task.js';
import MockNotifier from './mock/notifiers/notifier.js';
import Job from '../lib/job.js';


test('job: simple', async (t) => {
  const task1 = new MockTask('task1');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1']
  }, { task1 }, {});

  const success = await job.run();
  t.assert(success);
  t.is(task1.executionTimes, 1);
});

test('job: failure early stop', async (t) => {
  const task1 = new MockTask('task1');
  const task2 = new MockFailTask('task2');
  const task3 = new MockTask('task3');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1', 'task2', 'task3']
  }, { task1, task2, task3 }, {});

  const success = await job.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  t.is(task2.executionTimes, 1);
  t.is(task3.executionTimes, 0);
});

test('job: failure notifier', async (t) => {
  const task1 = new MockFailTask('task1');
  const notifier1 = new MockNotifier('notifier1');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_error: ['notifier1']
  }, { task1 }, { notifier1 });

  const success = await job.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  t.is(notifier1.notifySubject, 'Job test failed');
  t.is(notifier1.notifyBody, 'expected fail');
});

test('job: strip ansi before notify', async (t) => {
  const task1 = new MockFailTask('task1', '\u001b[31mtest\u001b[39m');
  const notifier1 = new MockNotifier('notifier1');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_error: ['notifier1']
  }, { task1 }, { notifier1 });

  const success = await job.run();
  t.assert(!success);
  t.is(notifier1.notifyBody, 'test');
});

test('job: failure job execution via notifier', async (t) => {
  const task1 = new MockFailTask('task1');
  const cleanupTask = new MockTask('cleanup-task');
  
  // Create a job notifier that runs the cleanup job
  const jobNotifier = new (await import('../lib/notifiers/job.js')).default('cleanup-notifier', { 
    job: 'cleanup-job' 
  });
  
  const mainJob = new Job('main-job', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_error: ['cleanup-notifier']
  }, { task1 }, { 'cleanup-notifier': jobNotifier });

  const cleanupJob = new Job('cleanup-job', {
    schedule: '* * * * *',
    tasks: ['cleanup-task']
  }, { 'cleanup-task': cleanupTask }, {});

  // Set up job resolver for the notifier
  const jobs = { 'main-job': mainJob, 'cleanup-job': cleanupJob };
  const jobResolver = name => jobs[name];
  jobNotifier.setJobResolver(jobResolver);

  const success = await mainJob.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  t.is(cleanupTask.executionTimes, 1); // Cleanup job should have run via notifier
});

test('job: failure job not found via notifier', async (t) => {
  const task1 = new MockFailTask('task1');
  
  // Create a job notifier that references a nonexistent job
  const jobNotifier = new (await import('../lib/notifiers/job.js')).default('bad-notifier', { 
    job: 'nonexistent-job' 
  });
  
  const job = new Job('test-job', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_error: ['bad-notifier']
  }, { task1 }, { 'bad-notifier': jobNotifier });

  jobNotifier.setJobResolver(() => null); // Returns null for nonexistent job

  const success = await job.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  // Should not crash even if failure job doesn't exist
});


