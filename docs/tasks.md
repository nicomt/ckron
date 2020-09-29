# Task Reference

- [Run Task](#run-task)
- [Exec Task](#exec-task)
- [Signal Task](#signal-task)


## `Run Task`

runs a command inside of a new container, using a specific image.

| Property | Description | Required |
|-|-|-|
| [`image`](#image) | Docker image to use | Yes |
| [`pull`](#pull) | Pull image before executing task | No |
| [`auto_remove`](#pull) | Remove container after task is finished | No |
| [`environment`](#environment) | Add environment variables | No |
| [`volumes`](#volumes) | Volumes to mount into the container | No |
| [`command`](#command) | Override the default image command | No |


#### **image**
Specify the image to start the container from.
```yml
image: redis
image: ubuntu:18.04
image: tutum/influxdb
image: example-registry.com:4000/postgresql
image: a4bc65f
```

#### **pull**
Pull image before executing task. Default value is *missing* 
```yml
pull: always # Always pull before executing task
pull: never # Don't pull image automatically
pull: missing # Pull image if not found locally
```

#### **pull**
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

#### **command**
Override the default image command. The command can also be a list

```yml
command: touch /tmp/example
command: ["touch", "/tmp/example"]
```

## `Exec Task`

Runs a new command in a running container

| Property | Description | Required |
|-|-|-|
| [`container`](#container) | Container name or container id | Yes |
| [`environment`](#environment) | Add environment variables | No |
| [`command`](#command) | Command to execute inside the container | Yes |


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
