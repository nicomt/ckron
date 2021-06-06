const path = require('path');
const shlex = require('shlex');
const dockerUtil = require('dockerode/lib/util');
const { promises: fs } = require('fs');
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

const MAX_OUTPUT_BUFFER_SIZE = 200000; // 200KB

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

  static parseArgs(args) {
    if (Array.isArray(args)) {
      const obj = {};
      for (const arg of args) {
        const [key, value] = arg.split('=');
        obj[key] = value || null;
      }
      return JSON.stringify(obj);
    }
    return JSON.stringify(args);
  }

  static buildOutputBufferStream() {
    const decoder = new StringDecoder('utf8');
    const res = { buffer: '' };
    res.stream = new Writable({
      write(chunk, encoding, callback) {
        res.buffer += decoder.write(chunk);
        if (res.buffer.length > Util.MAX_OUTPUT_BUFFER_SIZE) {
          const start = res.buffer.length - Util.MAX_OUTPUT_BUFFER_SIZE;
          res.buffer = res.buffer.substring(start);
        }
        callback();
      }
    });

    return res;
  }

  static async getFiles(dir) {
    const files = [];
    const dirReads = [];
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      const file = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        dirReads.push(Util.getFiles(file));
      } else {
        files.push(file);
      }
    }
    files.concat(...await Promise.all(dirReads));
    return files;
  }

  static formatError(err) {
    // Docker error
    if (err.json && err.json.message) {
      return err.json.message.toString();
    }
    if (err.message) {
      return err.message.toString();
    }
    return err.toString();
  }

}

Util.MAX_OUTPUT_BUFFER_SIZE = MAX_OUTPUT_BUFFER_SIZE;

module.exports = Util;
