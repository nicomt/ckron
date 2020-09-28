const shlex = require('shlex');
const dockerUtil = require('dockerode/lib/util');
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

class Util {

  static parseRepositoryTag(image) {
    return dockerUtil.parseRepositoryTag(image);
  }

  static parseCommand(cmd) {
    if (Array.isArray(cmd)) return cmd;
    return shlex.split(cmd);
  }

  static parseEnvironment(env) {
    if (Array.isArray(env)) {
      return env;
    }
    return Object.entries(env).map(([k, v]) => `${k}${v ? `=${v}` : ''}`);
  }

  static buildBufferStream() {
    const decoder = new StringDecoder('utf8');
    const res = { buffer: '' };
    res.stream = new Writable({
      write(chunk, encoding, callback) {
        res.buffer += decoder.write(chunk);
        callback();
      }
    });

    return res;
  }

}

module.exports = Util;
