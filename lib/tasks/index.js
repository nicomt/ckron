const RunTask = require('./run');
const ExecTask = require('./exec');
const LocalTask = require('./local');
const SignalTask = require('./signal');

module.exports = {
  run: RunTask,
  exec: ExecTask,
  local: LocalTask,
  signal: SignalTask
};
