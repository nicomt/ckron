
class CkronError extends Error {
  constructor(message, code, exitCode = 1) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
  }
}

export default CkronError;
