# ckron

> A cron-style job scheduler for docker

[![NPM Version](https://img.shields.io/npm/v/ckron)](https://www.npmjs.org/package/ckron)
[![Test](https://github.com/nicomt/ckron/workflows/Test/badge.svg)](https://github.com/nicomt/ckron/actions)
[![Docker Image Size](https://img.shields.io/docker/image-size/nicomt/ckron/latest)](https://hub.docker.com/r/nicomt/ckron)

`ckron` is a versatile and straightforward tool to schedule operations on containerized applications.

`ckron` is heavily inspired by [ofelia](https://github.com/mcuadros/ofelia) but attempts to improve on it by allowing multiple [tasks](#tasks) per `job`. Using `tasks`, you can compose complex workflows with a few off-the-shelf images and follow Docker's motto of one process per container.

## Install

If you have Node installed:
```
$ npm i -g ckron
```
If you only have Docker installed:
```
$ docker pull nicomt/ckron
```

## Usage

If you installed it in Node:
```
$ ckron daemon --config /path/to/config.yml
```
If you installed it in Docker:
```
$ docker run --rm -it \
      -v $PWD/config.yml:/etc/ckron/config.yml \
      -v /var/run/docker.sock:/var/run/docker.sock \
      nicomt/ckron daemon
```

> **_NOTE:_** For production is recommended to use docker with a [restart policy](https://docs.docker.com/config/containers/start-containers-automatically/) or create a service in something like [systemd](https://medium.com/@benmorel/creating-a-linux-service-with-systemd-611b5c8b91d6), upstart or [forever](https://www.npmjs.com/package/forever). A service will ensure the daemon is restarted in case of an unexpected failure


## Configuration
The configuration consists of a YAML file, which is meant to have familiar `docker compose` like syntax. The main sections of the config file are the following:  

### Tasks
Single operations that can be carried out by a job. Tasks currently supported are:

  - `run`: Runs a command inside of a new container, using a specific image.
  - `exec`: Runs a new command in a running container
  - `signal`: Send a signal to the main process inside the container. Similar to `docker kill --signal`

See [tasks reference](docs/tasks.md) for more documentation

### Jobs
Jobs are sets of tasks scheduled with a cron-like syntax. See [jobs reference](docs/jobs.md) for more documentation

### Notifiers
Notification channels for failed jobs. See [notifiers reference](docs/notifiers.md) for more documentation

### YAML Full Example

Run with `$ ckron daemon --config /path/to/config.yml` 
```yml
tasks:
  test-01:
    type: run
    command: printenv
    environment:
      HELLO: World
    image: ubuntu:latest
jobs:
  job-01:
    schedule: "*/30 * * * * *"
    on_error: ["email-dev"]
    run_on_init: true
    tasks:
      - test-01
notifiers:
  email-dev:
    type: email
    smtp_host: smtp.server.com
    smtp_port: 25
    smtp_auth:
      user: XXXXXXX
      pass: XXXXXXX
    to: dev@example.com
    from: '"Ckron Scheduler" <ckron@example.com>'
```
