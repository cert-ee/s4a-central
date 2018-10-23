'use strict';
const moment = require("moment");
const hell = new (require(__dirname + "/helper.js"))({module_name: "task"});
module.exports = function (task) {

  /**
   * CHECK FOR OLD TASKS AND CLEANUP
   *
   * @param cb
   */
  task.task = async function (input, cb) {
    hell.o("start", "task", "info");

    try {
      let tasks_filter = {
        fields: {
          id: true
        },
        where: {
          completed: true,
          failed: false
        }
      };

      let tasks_found = await task.find(tasks_filter);
      if (!tasks_found) throw new Error("Did not find any tasks");

      let tasks_limit_result = await task.app.models.settings.findOne({where: {name: "tasks_limit"}});
      let tasks_limit = tasks_limit_result.data;
      hell.o(["tasks_limit", tasks_limit], "task", "info");

      let to_remove = 0;

      if (tasks_found.length > tasks_limit) {
        to_remove = tasks_found.length - tasks_limit;
        for (let i = 0; i < to_remove; i++) {
          await task.destroyById(tasks_found[i].id);
        }
      }

      let success_message = to_remove + " old tasks_removed, found " + tasks_found.length + " vs limit" + tasks_limit;
      hell.o(success_message, "task", "info");
      return cb(null, {message: success_message});
    } catch (err) {
      hell.o(err, "task", "error");
      return cb({name: "Error", status: 400, message: err.message});
    }

  };

};
