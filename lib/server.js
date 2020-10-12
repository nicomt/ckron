const Koa = require('koa');
const Router = require('@koa/router');


class Server {
  constructor(ckron) {
    this.ckron = ckron;
    this.app = new Koa();

    const router = new Router();
    router.get('/jobs', async (ctx) => {
      ctx.body = Object.values(this.ckron.jobs).map(j => j.serialize());
    });

    router.get('/tasks', async (ctx) => {
      ctx.body = Object.values(this.ckron.tasks).map(t => t.serialize());
    });

    router.get('/notifiers', async (ctx) => {
      ctx.body = Object.values(this.ckron.notifiers).map(n => n.serialize());
    });

    this.app.use(
      router.middleware(),
      router.allowedMethods()
    );
  }

  listen() {
    this.app.listen(8080);
  }
}

module.exports = Server;
