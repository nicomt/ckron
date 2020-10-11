const chalk = require('chalk');
const util = require('./util');

const colors = ['magenta', 'green', 'yellow', 'cyan', 'blue', 'white', 'red', 'gray'];
class Log {
  constructor() {
    this.namespace = [];
    this.enabled = !process.env.CKRON_NOLOG;
  }

  info(message) {
    if (this.enabled) {
      console.log(`${this._formatNamespace()}: ${message}`);
    }
  }

  warning(message) {
    if (this.enabled) {
      console.warn(`${this._formatNamespace()}: ${message}`);
    }
  }

  debug(message) {
    if (this.enabled) {
      console.log(`${this._formatNamespace()}: ${message}`);
    }
  }

  error(message, err) {
    if (this.enabled) {
      if (err) message += ` - ${util.formatError(err)}`;
      console.error(`${this._formatNamespace()}: ${message}`);
    }
  }

  _formatNamespace() {
    return this.namespace
      .map((l, i) => chalk[colors[i % 8]](`[${l}]`))
      .join(' ');
  }

  pushNamespace(name) {
    this.namespace.push(name);
  }

  popNamespace() {
    this.namespace.pop();
  }
}

module.exports = Log;
