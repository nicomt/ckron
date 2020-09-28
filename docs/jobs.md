# Job Reference

## Job

Schedule for a list of tasks

| Property | Description | Required |
|-|-|-|
| [`schedule`](#schedule) | Cron-style job schedule | Yes |
| [`timezone`](#timezone) | Timezone for schedule | No |
| [`enabled`](#enabled) | When false job will not execute | No |
| [`run_on_init`](#run_on_init) | Run job on start | No |
| [`on_error`](#on_error) | List of notifier names to send task errors to | No |
| [`tasks`](#tasks) | List of task names for this job | Yes |

### **schedule**
Cron-style job schedule. The main difference from the vanilla cron syntax is that the finest granularity is seconds instead of minutes. For more information checkout the [node-cron](https://github.com/kelektiv/node-cron#available-cron-patterns) documentation

```yml
schedule: '*/10 * * * * *' # Run every 10 seconds
```

### **timezone**
[IANA Timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) to adjust the schedule time to. Default is to use the host time

```yml
timezone: America/Toronto
```

### **enabled**
When false job will not execute. Default value is *`true`*

```yml
enabled: false
```

### **run_on_init**
Run job on daemon startup. Default value is *`false`*

```yml
run_on_init: true
```

### **on_error**
List of notifier names to send task errors to

```yml
tasks:
  - notifier1
  - notifier2
  - notifier3
```

### **tasks**
List of task names for this job. All tasks will be executed sequentially

```yml
tasks:
  - task1
  - task2
  - task3
```
