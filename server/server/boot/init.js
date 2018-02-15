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
      } catch(no_feedbacks){}
      //hell.o( feedbacks, "check feedbacks", "info");
      if( !feedbacks || feedbacks === undefined || feedbacks.length == 0 ){
        hell.o("start", "create feedbacks", "info");
        await app.models.feedback.create({ case_number: 1, message: "Demo feedback message",
          comment: "Demo feedback comment", components: [], network_interfaces:[] });
        hell.o("done", "check feedbacks", "info");
      }

      const load_rulesets = util.promisify(app.models.ruleset.initialize);
      const load_settings = util.promisify(app.models.settings.initialize);

      hell.o("rulesets", "load", "info");
      let rulesets_result = await load_rulesets();
      if (!rulesets_result) throw new Error("failed to load rulesets");

      hell.o("settings", "load", "info");
      let settings_result = await load_settings();
      if (!settings_result) throw new Error("failed to load settings");
      //let settings = await app.models.settings;

      /*
      INTERVAL FORMATTING
      */
      app.check_interval_format = function (minutes, job_name) {
        if (minutes === undefined) minutes = 1;
        let schedule_rule = minutes * 60000;
        if (process.env.NODE_ENV == "dev" ) { //dev, tick faster
          //schedule_rule = 30000;
        }

        hell.o([job_name + " current ms:", schedule_rule], "load", "info");
        return schedule_rule;
      };

      /*
      SCHEDULE RULES CHECKING
       */
      hell.o("schedule rules checker", "init", "info");

      (function interval_rules() {
        setTimeout(() => {
          app.models.rule.rulesRoutine(() => {
            interval_rules();
          });
        }, app.check_interval_format(720, "job_interval_rules_check"));
      })();

      /*
      DETECTOR ONLINE CHECKING
      */
      hell.o("schedule detector online checker", "init", "info");

      (function interval_detectors_online() {
        setTimeout(() => {
          app.models.detector.checkRoutine(() => {
            interval_detectors_online();
          });
        }, app.check_interval_format(1, "job_interval_detectors_online_check"));
      })();

    }
    catch (err) {
      hell.o(err, "load", "error");
    }
  })();
};
