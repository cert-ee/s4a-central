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
        /*
              //TODO: turned off for testing
        {
          name: "detector_offline_checker",
          friendly_name: "Detectors offline checker",
          description: "Checks how long it has passed since the last communication with a detector, status is set to offline if its more than threshold",
          task_name: "detector_offline_check",
          task_friendly_name: "Check for offline detectors",
          task_description: "",
          task_params: {},
          module_name: "detector",
          interval_hh: false,
          interval_mm: 1,
          builtin: true
        }
        */
      ];

      // await tasker.destroyAll();
      // await tasker.app.models.feed.destroyAll();
      // await tasker.app.models.task.destroyAll();
      // await tasker.app.models.rule.destroyAll();

      hell.o("add feeds to default taskers", "initialize", "info");
      let feeds = await tasker.app.models.feed.find({where: { enabled: true }} );
      if (!feeds) throw new Error("failed to load feeds");

      for (const fd of feeds) {
        let feed_tasker = {
          name: fd.component_name + "_" + fd.name + "_updater",
          friendly_name: "Update content for " + fd.component_name,
          description: fd.description,
          task_name: fd.component_name + "_" + fd.name + "_update",
          task_friendly_name: "Check for new " + fd.component_name + " content",
          task_params: {feed_name: fd.name},
          task_description: "",
          module_name: "feed",
          interval_hh: false,
          // interval_mm: 240, #TODO for testing
          interval_mm: 1,
          builtin: true
        };

        default_taskers.push(feed_tasker)
      }

      hell.o("check default taskers", "initialize", "info");
      let create_result;
      for (const tr of default_taskers) {
        hell.o(["check default tasker", tr.name], "initialize", "info");
        create_result = await tasker.findOrCreate({where: {name: tr.name}}, tr);
        if (!create_result) throw new Error("failed to create tasker " + tr.name);
      }

      const all_taskers = await tasker.find();

      //check if we have tasks and create accordingly
      for (const tr of all_taskers) {
        tasker.loader(tr);
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


  tasker.checkTasks = async function () {
    hell.o("start", "checkTasks", "info");

    try {
      let tasks_found = await tasker.app.models.task.find({
        where: {
          completed: false,
          run_time: {lt: moment().valueOf()}
        }
      });

      if (tasks_found.length == 0) return;
      hell.o(["found", tasks_found.length], "checkTasks", "info");

      for (const t of tasks_found) {
        let task_update = {
          completed: true,
          failed: false
        };

        await tasker.app.models[t.module_name].task(t.params, function (result) {
          if (result !== null) {
            task_update.failed = true;
            hell.o(["task failed", t.name], "checkTasks", "info");
          }
        });

        if (!task_update.failed) {
          hell.o(["set task completed", t.name], "checkTasks", "info");
          let task_updated = await tasker.app.models.task.update({id: t.id}, task_update);
          await tasker.loader(t.parent_name);
        }
      }

      hell.o("done", "checkTasks", "info");
    } catch (err) {
      hell.o(err, "checkTasks", "error");
    }
  };


  /**
   * Get the next task run time
   *
   * @param input
   * @returns {number}
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

    //TODO: for testing
    next = moment().add(20,"seconds").valueOf();
    if (process.env.NODE_ENV == "dev") {
      //TODO: for testing
      // next = moment().add(1, "minutes").valueOf();
      next = moment().add(20,"seconds").valueOf();
    }

    return next;
  };

  tasker.loader = async function (input) {
    hell.o("start", "loader", "info");

    try {

      if (input !== null && typeof input !== 'object') {
        input = await tasker.findOne({where: {name: input}});
      }

      hell.o([input.task_name, "check existing task"], "loader", "info");
      let task_found = await tasker.app.models.task.findOne({where: {name: input.task_name, completed: false}});
      if (!task_found) {
      } else return;

      let time_calc = tasker.timeCalc(input);
      let task_input = {
        name: input.task_name,
        parent_name: input.name,
        friendly_name: input.task_friendly_name,
        params: input.task_params,
        description: input.task_description,
        module_name: input.module_name,
        run_time: time_calc
      };

      hell.o([input.task_name, "create new task"], "loader", "info");
      let task_create = await tasker.app.models.task.create(task_input);

    } catch (err) {
      hell.o(err, "loader", "error");

    }

  };

};
