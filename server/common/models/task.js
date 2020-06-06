'use strict';
const moment = require("moment");
const hell = new (require(__dirname + "/helper.js"))({module_name: "task"});
module.exports = function (task) {


  /**
   * CLEAR ALL TASKS
   *
   * @param input
   * @param cb
   */

  task.clearTasksHistory = function (cb) {
    hell.o("start", "clearTasksHistory", "info");
    (async function () {
      try {
        let tasks_filter = {
          fields: {
            id: true
          },
          where: {
            loading: {"neq": true}
          }
        };

        let tasks_found = await task.find(tasks_filter);
        if (!tasks_found) throw new Error("Did not find any tasks");

        if (tasks_found.length > 0) {
          for (let i = 0, l = tasks_found.length; i < l; i++) {
            await task.destroyById(tasks_found[i].id);
          }
        }

        await task.app.models.tasker.initialize();

        let success_message = tasks_found.length + " old tasks_removed";
        hell.o(success_message, "clearTasksHistory", "info");
        if (cb) return cb(null, {message: success_message});
        return true;
      } catch (err) {
        hell.o(err, "clearTasksHistory", "error");
        if (cb) return cb({name: "Error", status: 400, message: err.message});
        return false;
      }
    })(); // async
  };

  task.remoteMethod('clearTasksHistory', {
    accepts: [],
    returns: {type: 'object', root: true},
    http: {path: '/clearTasksHistory', verb: 'post', status: 200}
  });


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
          or: [
            {completed: true},
            {cancelled: true},
            {failed: true}
          ]
        }
      };

      let tasks_found = await task.find(tasks_filter);
      if (!tasks_found) throw new Error("Did not find any tasks");

      let settings = await task.app.models.settings.findOne();
      let tasks_limit = settings.tasks_limit;
      hell.o(["tasks_limit", tasks_limit], "task", "info");

      let to_remove = 0;

      if (tasks_found.length > tasks_limit) {
        to_remove = tasks_found.length - tasks_limit;
        for (let i = 0; i < to_remove; i++) {
          await task.destroyById(tasks_found[i].id);
        }
      }

      let success_message = to_remove + " old tasks_removed, found " + tasks_found.length + " vs limit " + tasks_limit;
      hell.o(success_message, "task", "info");
      if (cb) return cb(null, {message: success_message});
      return true;
    } catch (err) {
      hell.o(err, "task", "error");
      if (cb) return cb({name: "Error", status: 400, message: err.message});
      return false;
    }

  };

};
