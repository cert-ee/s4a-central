'use strict';

// const schedule = require('node-schedule');
const util = require('util');
const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "init"});

module.exports = function (app) {
  hell.o("start", "load", "info");
  (async () => {
    try {

      //insert demo feedback
      hell.o("start", "check feedbacks", "info");
      let feedbacks = false;
      try {
        feedbacks = await app.models.feedback.find();
      } catch (no_feedbacks) {
      }
      //hell.o( feedbacks, "check feedbacks", "info");
      if (!feedbacks || feedbacks === undefined || feedbacks.length == 0) {
        hell.o("start", "create feedbacks", "info");
        await app.models.feedback.create({
          case_number: 1, message: "Demo feedback message",
          comment: "Demo feedback comment", components: [], network_interfaces: []
        });
        hell.o("done", "check feedbacks", "info");
      }

      await app.models.boot.initialize();
      await app.models.settings.initialize();
      await app.models.ruleset.initialize();
      await app.models.yara.initialize();
      await app.models.wise.initialize();
      await app.models.feed.initialize();
      await app.models.tasker.initialize();

    }
    catch (err) {
      hell.o(err, "load", "error");
    }
  })();
};
