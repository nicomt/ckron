import Log from '../log.js';

class JobNotifier {
  constructor(name, { job: jobName }) {
    this.name = name;
    this.jobName = jobName;
    this.log = new Log();
    this.log.pushNamespace('job-notifier');
    this.log.pushNamespace(name);
  }

  setJobResolver(resolver) {
    this.getJob = resolver;
  }

  async notify({ subject, body }) {
    this.log.info(`Running failure job: ${this.jobName}`);
    
    if (!this.getJob) {
      this.log.error('Job resolver not set');
      return;
    }

    try {
      const failureJob = this.getJob(this.jobName);
      if (failureJob) {
        // Run the job with notifyError=false to prevent infinite loops
        await failureJob.run(false);
        this.log.info(`Failure job ${this.jobName} completed`);
      } else {
        this.log.warn(`Failure job '${this.jobName}' not found`);
      }
    } catch (err) {
      this.log.error(`Failure job ${this.jobName} execution failed`, err);
    }
  }
}

export default JobNotifier;