'use strict';
const moment = require("moment");
const cronParser = require("cron-parser");
const hell = new (require(__dirname + "/helper.js"))({module_name: "tasker"});
module.exports = function (tasker) {

  /**
   * INITIALIZE TASKER
   *
   * create defaults
   */
  tasker.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      let default_taskers = [
        {
          name: "detector_offline_checker",
          friendly_name: "Detectors offline checker",
          enabled: true,
          description: "Checks how long it has passed since the last communication with a detector, status is set to offline if its more than threshold",
          task_name: "detector_offline_check",
          task_friendly_name: "Check for offline detectors",
          task_description: "",
          task_params: {
            check_name: "offline"
          },
          module_name: "detector",
          cron_expression: "*/1 * * * *",
          builtin: true
        },
        {
          name: "detector_rule_count_checker",
          friendly_name: "Detectors rule count checker",
          enabled: true,
          description: "Checks if some rules are enabled",
          task_name: "detector_rule_count_check",
          task_friendly_name: "Check for detector rule count",
          task_description: "",
          task_params: {
            check_name: "rule_count"
          },
          module_name: "detector",
          cron_expression: "*/30 * * * *",
          builtin: true
        },
        {
          name: "tasks_history_cleaner",
          friendly_name: "Tasks history cleanup",
          enabled: true,
          description: "Remove old completed tasks from database",
          task_name: "tasks_history_cleanup",
          task_friendly_name: "Tasks cleanup",
          task_description: "Check for old tasks to remove",
          task_params: {},
          module_name: "task",
          cron_expression: "*/10 * * * *",
          builtin: true
        }

      ];

      // await tasker.destroyAll();
      // await tasker.app.models.feed.destroyAll();
      // await tasker.app.models.task.destroyAll();
      // await tasker.app.models.rule.destroyAll();


      hell.o("check default taskers", "initialize", "info");
      let create_result;
      for (const tr of default_taskers) {
        hell.o(["check default tasker", tr.name], "initialize", "info");
        create_result = await tasker.findOrCreate({where: {name: tr.name}}, tr);
        if (!create_result) throw new Error("failed to create tasker " + tr.name);
      }

      hell.o("add feeds to taskers", "initialize", "info");
      let feeds = await tasker.app.models.feed.find({where: {enabled: true}});
      if (!feeds) throw new Error("failed to load feeds");

      for (const fd of feeds) {
        await tasker.addFeedTasker(fd);
      }

      const all_taskers = await tasker.find();

      //check if we have tasks and create accordingly
      for (const tr of all_taskers) {
        if (!tr.enabled) continue;
        // console.log( tr );
        await tasker.task_loader(tr);
      }

      //moloch_wise_domain_local_updater
      //await tasker.task_loader(tr);


      //tasker ticker
      setInterval(function () {
        tasker.checkTasks();
      }, 5000);

      return true;
    } catch (err) {
      hell.o(err, "initialize", "error");
      return false;
    }
  };

  /**
   * ADD TASKER FOR A FEED
   *
   * @param input
   */
  tasker.addFeedTasker = async function (input) {
    hell.o("start", "addFeedTasker", "info");
    try {
      // hell.o(input, "addFeedTasker", "info");
      let settings = await tasker.app.models.settings.findOne();
      if (!settings) throw new Error("could not load settings");

      let feed_tasker = {
        name: input.component_name + "_" + input.name + "_updater",
        friendly_name: "Update content for " + input.component_name,
        enabled: input.enabled,
        description: input.description,
        task_name: input.component_name + "_" + input.name + "_update",
        task_friendly_name: "Check for new " + input.component_name + " content",
        task_params: {feed_name: input.name, component_name: input.component_name},
        task_description: "",
        module_name: "feed",
        cron_expression: settings['tasker_default_cron_expression'],
        builtin: true
      };

      let create_result = await tasker.findOrCreate({where: {name: feed_tasker.name}}, feed_tasker);
      if (!create_result) throw new Error("failed to create tasker " + feed_tasker.name);

      if (create_result[0].enabled) {
        await tasker.task_loader(feed_tasker);
      }

      hell.o("done", "addFeedTasker", "info");
    } catch (err) {
      hell.o(err, "addFeedTasker", "error");
    }
  };

  /**
   * REMOVE TASKER FOR A FEED
   *
   * @param input
   */
  tasker.removeFeedTasker = async function (input) {
    hell.o("start", "removeFeedTasker", "info");
    try {
      hell.o(input.name, "removeFeedTasker", "info");

      let found_tasker = await tasker.findOne({where: {name: input.component_name + "_" + input.name + "_updater"}});
      if (!found_tasker) throw new Error("failed to find tasker " + input.name);

      await tasker.task_unloader(found_tasker);

      let remove_result = await tasker.destroyById(found_tasker.id);
      if (!remove_result) throw new Error("failed to remove tasker " + input.name);

      hell.o("done", "removeFeedTasker", "info");
    } catch (err) {
      hell.o(err, "removeFeedTasker", "error");
    }
  };

  /**
   * LOAD NEW TASK FOR A TASKER
   *
   * @param input
   * @param time_override | if true, set next run in 60 sec
   */
  tasker.task_loader = async function (input, time_override) {
    hell.o("start", "task_loader", "info");
    try {

      if (input !== null && typeof input !== 'object') {
        input = await tasker.findOne({where: {name: input}});
      }
      if (input.name === undefined) throw new Error("no_data");

      if (!input.enabled) {
        hell.o([input.task_name, "trying to load task for inactive tasker, ignoring"], "task_loader", "warn");
        return;
      }

      hell.o([input.task_name, "check existing task"], "task_loader", "info");
      let task_found = await tasker.app.models.task.findOne({
        where:
          {
            name: input.task_name,
            completed: false,
            cancelled: false
          }
      });

      if (!!task_found) {
        hell.o([input.task_name, "existing task found not creating"], "task_loader", "warn");
        return true;
      }


      let time_calc = tasker.timeCalc(input);
      if (time_override) {
        time_calc = moment().add(60, "seconds").valueOf();
      }

      let task_input = {
        name: input.task_name,
        parent_name: input.name,
        friendly_name: input.task_friendly_name,
        params: input.task_params,
        description: input.task_description,
        module_name: input.module_name,
        start_time: time_calc
      };

      hell.o([input.task_name, "create new task"], "task_loader", "info");
      let task_create = await tasker.app.models.task.create(task_input);
      return true;
    } catch (err) {
      hell.o(err, "task_loader", "error");
      return false;
    }

  };

  /**
   * SET TASK AS CANCELLED FOR A TASKER
   *
   * @param input
   */
  tasker.task_unloader = async function (input) {
    hell.o([input.task_name, "unload existing task"], "task_unloader", "info");
    try {
      hell.o(input, "task_unloader", "info");

      let task_found = await tasker.app.models.task.findOne({
        where: {
          name: input.task_name,
          completed: false,
          cancelled: false
        }
      });
      if (task_found) {
        hell.o(["task_found", task_found.name], "task_unloader", "info");
        let task_update = {
          completed: false,
          failed: false,
          cancelled: true,
          start_time: moment().valueOf(),
          completed_time: moment().valueOf(),
          logs: {
            "success": {
              message: "tasker disabled"
            },
            error: ""
          }
        };
        let task_updated = await tasker.app.models.task.update({id: task_found.id}, task_update);
      }
      hell.o("done", "task_unloader", "info");
    } catch (err) {
      hell.o(err, "task_unloader", "error");
    }

  };

  /**
   * RELOAD TASKER TASKS
   *
   * if cron changes for example
   *
   * @param tasker_name
   * @param cb
   */
  tasker.reloadTaskerTasks = function (tasker_name, cb) {
    hell.o(["start", tasker_name], "reloadTaskerTasks", "info");

    (async function () {
      try {

        let tasker_found = await tasker.findOne({where: {name: tasker_name}});
        // console.log(result);
        if (!tasker_found) throw new Error("no_data");

        //remove current task
        await tasker.task_unloader(tasker_found);
        //recreate task with
        await tasker.task_loader(tasker_found);

        let output = {message: "Tasker tasks reloaded"};

        hell.o([tasker_name, "done"], "reloadTaskerTasks", "info");
        cb(null, output);
      } catch (err) {
        hell.o(err, "reloadTaskerTasks", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  tasker.remoteMethod('reloadTaskerTasks', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/reloadTaskerTasks', verb: 'post', status: 201}
  });

  /**
   * Get the next task run time
   *
   * @param input
   */
  tasker.timeCalc = function (input) {
    // console.log( "timeCalc" );
    // console.log( input );
    let cron_expression = input.cron_expression;
    // console.log( cron_expression );
    let interval = cronParser.parseExpression(cron_expression);
    let next = interval.next();
    // console.log( next );

    // if (process.env.NODE_ENV == "dev") {
    //TODO: for testing
    // next = moment().add(1, "minutes").valueOf();
    // next = moment().add(120, "seconds").valueOf();
    // }

    return next;
  };


  /**
   * TASK CHECKER
   *
   * if task has start time in the past:
   * run task
   * save result
   * create a new task
   *
   */
  tasker.checkTasks = async function (task_name) {
    hell.o("start", "checkTasks", "info");

    let current_tasker;

    try {

      let duplicates_filter = {
        where: {
          completed: false,
          cancelled: false
        }
      };

      //cancel duplicates
      let duplicates_check = await tasker.app.models.task.find(duplicates_filter);
      let duplicate_update = {cancelled: true};
      let check_dups = [];
      for (const t of duplicates_check) {
        if (check_dups.includes(t.name)) {
          duplicate_update.modified_time = moment().valueOf();
          duplicate_update.logs = {error: "automatically cancelled as duplicate task at " + duplicate_update.modified_time};
          await tasker.app.models.task.update({id: t.id}, duplicate_update);
          console.log(duplicate_update);
          hell.o(["cancelled duplicate task for", t.name], "checkTasks", "warn");
        } else {
          check_dups.push(t.name);
        }
      }

      let overdue_filter = {
        where: {
          completed: false,
          cancelled: false,
          start_time: {lt: moment().subtract(15, "minutes").valueOf()}
        }
      };

      //incase node is killed while task was running
      let overdue_check = await tasker.app.models.task.find(overdue_filter);
      let overdue_update = {cancelled: true};
      for (const t of overdue_check) {
        overdue_update.modified_time = moment().valueOf();
        overdue_update.logs = {error: "automatically cancelled as overdue task at " + overdue_update.modified_time};
        await tasker.app.models.task.update({id: t.id}, overdue_update);
        await tasker.update({name: t.name}, {loading: false});
        console.log(overdue_update);

        //reload tasks
        await tasker.reloadTaskerTasks(t.parent_name, function () {
        });
      }

      let tasks_filter = {
        where: {
          completed: false,
          cancelled: false,
          start_time: {lt: moment().valueOf()}
        }
      };

      if (task_name !== undefined) {
        tasks_filter = {
          where: {
            completed: false,
            cancelled: false,
            name: task_name
          }
        };
      }

      let tasks_found = await tasker.app.models.task.find(tasks_filter);

      if (tasks_found.length == 0) return;
      hell.o(["found", tasks_found.length], "checkTasks", "info");

      let task_updated, task_update, worker_busy = false;
      for (const t of tasks_found) {
        worker_busy = false;
        task_update = {
          completed: true,
          failed: false
        };

        if (task_name !== undefined) {
          task_update.start_time = moment().valueOf();
        }

        current_tasker = t.parent_name;
        await tasker.app.models.task.update({id: t.id}, {loading: true});
        await tasker.update({name: current_tasker}, {loading: true});

        await tasker.app.models[t.module_name].task(t.params, function (error, success) {
          let output = {success: "", error: ""};
          if (success) {
            output.success = success;
          }

          if (error !== null) {
            if (typeof error === 'object' && error.hasOwnProperty("worker_busy") && error.worker_busy) {
              return worker_busy = true;
            }

            task_update.failed = true;
            output.error = error;
            hell.o(["task failed", t.name], "checkTasks", "info");
          }
          task_update.logs = output;
        });

        if (worker_busy) {
          hell.o(["task postponed because worker is busy", t.name], "checkTasks", "info");
          task_update = {
            logs: {message: "worker busy, trying again in 60 seconds"},
            start_time: moment().add(60, "seconds").valueOf(),
            modified_time: moment().valueOf(),
            loading: false
          };
          await tasker.app.models.task.update({id: t.id}, task_update);
          if (task_name !== undefined) {
            return {worker_busy: true};
          }
          continue;
        }

        task_update.modified_time = moment().valueOf();
        task_update.completed_time = moment().valueOf();
        task_update.loading = false;

        hell.o(["set task completed", t.name], "checkTasks", "info");
        await tasker.update({name: current_tasker}, {loading: false});
        task_updated = await tasker.app.models.task.update({id: t.id}, task_update);

        let check_if_tasker_enabled = await tasker.find({where: {task_name: t.name, enabled: true}});
        if (check_if_tasker_enabled.length > 0) {
          await tasker.task_loader(t.parent_name, task_update.failed);
        }

      }

      hell.o("done", "checkTasks", "info");
      return true;
    } catch (err) {
      hell.o(err, "checkTasks", "error");
      await tasker.update({name: current_tasker}, {loading: false});
      return false;
    }
  };

  /**
   * RUN TASK NOW
   *
   * @param task_name
   * @param cb
   */
  tasker.runTask = function (task_name, cb) {
    hell.o(["start", task_name], "runTask", "info");

    (async function () {
      try {

        let result = await tasker.checkTasks(task_name);
        // console.log(result);

        let output = {message: "Task finished, check logs"};
        if (typeof result === 'object' && result.hasOwnProperty("worker_busy")) {
          hell.o([task_name, "worker_busy"], "runTask", "error");
          return cb({name: "Error", status: 400, message: "worker_busy"});
        }
        hell.o([task_name, "done"], "runTask", "info");

        cb(null, output);

      } catch (err) {
        hell.o(err, "runTask", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  tasker.remoteMethod('runTask', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/runTask', verb: 'post', status: 201}
  });

  /**
   * TOGGLE TASKER
   *
   * @param name
   * @param enabled
   * @param cb
   */
  tasker.toggleEnable = function (tasker_name, enabled, cb) {
    hell.o(["start " + tasker_name, "enabled " + enabled], "toggleEnable", "info");

    (async function () {
      try {

        let tasker_found = await tasker.findOne({where: {name: tasker_name}});
        if (!tasker_found) throw new Error(tasker_name + " could not find tasker");

        let update_input = {enabled: enabled, last_modified: moment().valueOf(), loading: false};
        let update_result = await tasker.update({name: tasker_name}, update_input);
        if (!update_result) throw new Error(tasker_name + " could not update tasker ");

        tasker_found = await tasker.findOne({where: {name: tasker_name}});
        if (!tasker_found) throw new Error(tasker_name + " could not find tasker");

        if (enabled) {
          await tasker.task_loader(tasker_found);
        }

        if (!enabled) {
          await tasker.task_unloader(tasker_found);
        }

        hell.o([tasker_name, update_result], "toggleEnable", "info");
        hell.o([tasker_name, "done"], "toggleEnable", "info");

        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "toggleEnable", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  tasker.remoteMethod('toggleEnable', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'enabled', type: 'boolean', required: true},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/toggleEnable', verb: 'post', status: 201}
  });


};
