# Task Reference

- [Run Task](#run-task)
- [Exec Task](#exec-task)
- [Signal Task](#signal-task)


## `Run Task`

runs a command inside of a new container, using a specific image.

| Property | Description | Required |
|-|-|-|
| [`image`](#image) | Docker image to use | Yes |
| [`build`](#build) | Options for building a docker image | No |
| [`update`](#update) | Pull or build image before executing task | No |
| [`pull`](#pull) | Pull image before executing task | No |
| [`auto_remove`](#auto_remove) | Remove container after task is finished | No |
| [`environment`](#environment) | Add environment variables | No |
| [`volumes`](#volumes) | Volumes to mount into the container | No |
| [`entrypoint`](#entrypoint) | Override the default entrypoint | No |
| [`command`](#command) | Override the default image command | No |
| [`user`](#user) | User to run the command as | No |
| [`working_dir`](#working_dir) | Working directory for the command | No |


#### **image**
Specify the image to start the container from. If you specify build, ckron uses this value as the name for the built image 
```yml
image: redis
image: ubuntu:18.04
image: tutum/influxdb
image: example-registry.com:4000/postgresql
image: a4bc65f
```

#### **build**
Configuration options for building a docker image for use in the run task 
```yml
build: ./dir
build:
  context: ./dir
  dockerfile: Dockerfile-alternate
  args:
    buildno: 1
```

#### **update**
Pull or build image before executing task. Default value is *missing* 
```yml
update: always # Always update before executing task
update: never # Don't update image automatically
update: missing # Pull or build image if not found locally
```

#### **pull**
**Deprecated**: use [update](#update) instead
Pull image before executing task. Default value is *missing* 
```yml
pull: always # Always pull before executing task
pull: never # Don't pull image automatically
pull: missing # Pull image if not found locally
```

#### **auto_remove**
Remove container after task is finished. Default value is `true`

```yml
auto_remove: false
```

#### **environment**
Add environment variables. You can use either an array or a dictionary. Any boolean values (true, false, yes, no) need to be enclosed in quotes to ensure they are not converted to True or False by the YML parser.

```yml
environment:
  RACK_ENV: development
  SHOW: 'true'
  SESSION_SECRET:

environment:
  - RACK_ENV=development
  - SHOW=true
  - SESSION_SECRET
```

#### **volumes**
Bind mount host machine directory into the container. It uses `SOURCE:TARGET[:MODE]` format, where SOURCE is a host path and TARGET is the container path where the directory is mounted. Standard modes are ro for read-only and rw for read-write (default).

```yml
volumes:
  - /opt/data:/var/lib/mysql
  - /etc/config:/etc/config:ro
```
#### **entrypoint**
Override the default entrypoint. The entrypoint can also be a list

```yml
entrypoint: /code/entrypoint.sh
entrypoint: ["php", "-d", "memory_limit=-1", "vendor/bin/phpunit"]
```

#### **command**
Override the default image command. The command can also be a list

```yml
command: touch /tmp/example
command: ["touch", "/tmp/example"]
```

#### **user**
User to run the command as.

```yml
user: nobody
```

#### **working_dir**
Working directory for the command.

```yml
working_dir: /tmp
```

## `Exec Task`

Runs a new command in a running container

| Property | Description | Required |
|-|-|-|
| [`container`](#container) | Container name or container id | Yes |
| [`command`](#command) | Command to execute inside the container | Yes |
| [`environment`](#environment) | Add environment variables | No |
| [`working_dir`](#working_dir) | Working directory for the command | No |
| [`user`](#user) | User to execute as | No |



#### **container**
Container name or container id of the container were the command should be executed.

```yml
container: my_container
container: c9b92d9a79d3
```

#### **environment**
Add environment variables. You can use either an array or a dictionary. Any boolean values (true, false, yes, no) need to be enclosed in quotes to ensure they are not converted to True or False by the YML parser.

```yml
environment:
  RACK_ENV: development
  SHOW: 'true'
  SESSION_SECRET:

environment:
  - RACK_ENV=development
  - SHOW=true
  - SESSION_SECRET
```

#### **command**
Command to execute inside the container. The command can also be a list

```yml
command: touch /tmp/example
command: ["touch", "/tmp/example"]
```

#### **user**
User to execute as.

```yml
user: nobody
```

## `Signal Task`
Send a signal to the main process inside the container. Similar to `docker kill --signal`

| Property | Description | Required |
|-|-|-|
| [`container`](#container) | Container name or container id | Yes |
| [`signal`](#signal) | Signal to send to the process | Yes |

#### **container**
Container name or container id of the container were the signal will be sent.

```yml
container: my_container
container: c9b92d9a79d3
```

#### **signal**
Signal to send to the process.

```yml
signal: SIGHUP
```

#### **working_dir**
Working directory for the command.

```yml
working_dir: /tmp
```
