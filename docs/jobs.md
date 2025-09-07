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
| [`on_failure`](#on_failure) | Job name to run when this job fails | No |
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
on_error:
  - notifier1
  - notifier2
  - notifier3
```

### **on_failure**
Job name to run when this job fails. This provides a powerful way to handle job failures by running cleanup tasks, custom notifications, or recovery procedures. The failure job will run immediately after the main job fails, but before error notifications are sent.

```yml
on_failure: cleanup-job
```

**Example configuration:**
```yml
jobs:
  backup-job:
    schedule: "0 2 * * *"
    tasks:
      - backup-database
      - backup-files
    on_failure: cleanup-failed-backup
    on_error:
      - email-admin
  
  cleanup-failed-backup:
    schedule: "0 0 1 1 1"  # Never run on schedule
    enabled: false          # Only run when triggered by failure
    tasks:
      - cleanup-temp-files
      - send-slack-alert
```

**Notes:**
- The failure job runs with error notifications disabled to prevent infinite loops
- If the specified failure job doesn't exist, a warning is logged but execution continues
- Failure jobs can be regular jobs with their own schedules, or dedicated cleanup jobs that only run on failure

### **tasks**
List of task names for this job. All tasks will be executed sequentially

```yml
tasks:
  - task1
  - task2
  - task3
```
