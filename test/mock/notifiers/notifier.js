

class MockNotifier {
  constructor(name) {
    this.name = name;
    this.notifySubject = null;
    this.notifyBody = null;
  }

  async notify({ subject, body }) {
    this.notifySubject = subject;
    this.notifyBody = body;
  }
}

export default MockNotifier;
