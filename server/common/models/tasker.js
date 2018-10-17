'use strict';
const moment = require("moment");
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
          task_params: {},
          module_name: "detector",
          interval_hh: false,
          interval_mm: 1,
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
          interval_hh: false,
          interval_mm: 10,
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
        if( !tr.enabled ) continue;
        // console.log( tr );
        tasker.task_loader(tr);
      }

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

      let feed_tasker = {
        name: input.component_name + "_" + input.name + "_updater",
        friendly_name: "Update content for " + input.component_name,
        enabled: input.enabled,
        description: input.description,
        task_name: input.component_name + "_" + input.name + "_update",
        task_friendly_name: "Check for new " + input.component_name + " content",
        task_params: {feed_name: input.name},
        task_description: "",
        module_name: "feed",
        interval_hh: false,
        interval_mm: 240,
        //interval_mm: 1, #TODO for testing
        builtin: true
      };

      let create_result = await tasker.findOrCreate({where: {name: feed_tasker.name}}, feed_tasker);
      if (!create_result) throw new Error("failed to create tasker " + feed_tasker.name);

      await tasker.task_loader(feed_tasker);

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

      let remove_result = await tasker.destroyById(found_tasker.id);
      if (!remove_result) throw new Error("failed to remove tasker " + input.name);

      await tasker.task_unloader(found_tasker);

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
      if( !input.enabled ) return;

      hell.o([input.task_name, "check existing task"], "task_loader", "info");
      let task_found = await tasker.app.models.task.findOne({where: {name: input.task_name, completed: false}});
      if (!task_found) {
      } else return;

      let time_calc = tasker.timeCalc(input);
      if( time_override ){
        time_calc = moment().add(60, "seconds").valueOf();
      }

      let task_input = {
        name: input.task_name,
        parent_name: input.name,
        friendly_name: input.task_friendly_name,
        params: input.task_params,
        description: input.task_description,
        module_name: input.module_name,
        run_time: time_calc
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
   * SET TASK AS COMPLETED FOR A TASKER
   *
   * @param input
   */
  tasker.task_unloader = async function (input) {
    hell.o([input.task_name, "unload existing task"], "task_unloader", "info");
    try {
      hell.o(input, "task_unloader", "info");

      let task_found = await tasker.app.models.task.findOne({where: {name: input.task_name, completed: false}});
      if (task_found) {
        hell.o(["task_found", task_found.name], "task_unloader", "info");
        let task_update = {
          completed: true,
          failed: false
        };
        let task_updated = await tasker.app.models.task.update({id: task_found.id}, task_update);
      }
      hell.o("done", "task_unloader", "info");
    } catch (err) {
      hell.o(err, "task_unloader", "error");
    }

  };

  /**
   * Get the next task run time
   *
   * @param input
   */
  tasker.timeCalc = function (input) {
    let mm = parseInt(input.interval_mm);
    let hh = parseInt(input.interval_hh);
    let next = "";

    if (Number.isInteger(hh)) {
      next = moment().startOf("hour").add(hh, "hours").valueOf();
    } else {
      let start = moment();
      let closest = mm - (start.minute() % mm);
      next = moment(start).add(closest, "minutes").valueOf();
    }

    if (process.env.NODE_ENV == "dev") {
      //TODO: for testing
      // next = moment().add(1, "minutes").valueOf();
      // next = moment().add(120, "seconds").valueOf();
    }

    return next;
  };



  /**
   * TASK CHECKER
   *
   * if task is pased exec time:
   * run task
   * save result
   * create a new task
   *
   */
  tasker.checkTasks = async function ( task_name ) {
    hell.o("start", "checkTasks", "info");

    try {
      let tasks_filter = {
        where: {
          completed: false,
          run_time: {lt: moment().valueOf()}
        }
      };

      if( task_name !== undefined) {
        tasks_filter = {
          where: {
            completed: false,
            name: task_name
          }
        };
      }

      let tasks_found = await tasker.app.models.task.find( tasks_filter );

      if (tasks_found.length == 0) return;
      hell.o(["found", tasks_found.length], "checkTasks", "info");

      let task_updated, task_update;
      for (const t of tasks_found) {
        task_update = {
          completed: true,
          failed: false
        };

        await tasker.app.models[t.module_name].task(t.params, function (error,success) {
          let output = { success: "", error: "" };
          if( success ){
            output.success = success;
          }
          if (error !== null) {
            task_update.failed = true;
            output.error = error;
            hell.o(["task failed", t.name], "checkTasks", "info");
          }
          task_update.logs = output;
        });

        task_update.modified_time = moment().valueOf();

        hell.o(["set task completed", t.name], "checkTasks", "info");
        task_updated = await tasker.app.models.task.update({id: t.id}, task_update);

        let check_if_tasker_enabled = await tasker.findOne({where: {task_name: t.name, enabled: true}});
        if( check_if_tasker_enabled ) {
          await tasker.task_loader(t.parent_name, task_update.failed);
        }

      }

      hell.o("done", "checkTasks", "info");
      return true;
    } catch (err) {
      hell.o(err, "checkTasks", "error");
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
    hell.o(["start", task_name], "run_task", "info");

    (async function () {
      try {

        await tasker.checkTasks( task_name );

        hell.o([task_name, "done"], "run_task", "info");

        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "run_task", "error");
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

        let tasker_found = await tasker.find({where: {name: tasker_name}});
        if (!tasker_found) throw new Error(tasker_name + " could not find tasker");

        let update_input = {enabled: enabled, last_modified: new Date()};
        let update_result = await tasker.update({name: tasker_name}, update_input);
        if (!update_result) throw new Error(tasker_name + " could not update tasker ");

        if (enabled) {
          tasker.task_loader(tasker_name);
        }

        if (!enabled) {
          tasker.task_unloader(tasker_name);
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
