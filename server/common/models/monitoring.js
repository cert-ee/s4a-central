'use strict';

const moment = require('moment');
const hell = new (require(__dirname + "/helper.js"))({module_name: "monitoring"});

module.exports = function (monitoring) {

  /**
   * STATUS ABOUT DETECORS
   *
   * @param options
   * @param cb
   */
  monitoring.detectors = function (options, req, cb) {
    hell.o("start", "detectors", "info");

    // let token = options.accessToken.id;
    // hell.o(["token used: ", token], "detectors", "info");

    (async function () {
      try {

        let filter = {
          fields: [
            "name",
            "friendly_name",
            "organization_name",
            "description",
            "version",
            "activated",
            "registration_status", //completed
            "components_overall",
            "components",
            "updates_overall",
            "online",
            "rules_count",
            "rules_count_enabled",
            "rules_count_custom",
            "last_seen",
            "last_rules_check",
            "last_wise_check",
            "last_yara_check",
            "last_alerts_report",
            "last_alerts_report_count",
            "last_alerts_actual_report",
            "last_alerts_actual_report_count",
          ]
        };
        //should add registration_status : "Completed" and activated: true

        let all_detectors = await monitoring.app.models.detector.find(filter);
        let output = [];

        //add unix timestamp values for parsing ease..
        for (let detector of all_detectors) {
          detector.last_seen_timestamp = moment(detector.last_seen).unix();
          detector.last_rules_check_timestamp = moment(detector.last_rules_check).unix();
          detector.last_wise_check_timestamp = moment(detector.last_wise_check).unix();
          detector.last_yara_check_timestamp = moment(detector.last_yara_check).unix();
          detector.last_alerts_report_timestamp = moment(detector.last_alerts_report).unix();
          detector.last_alerts_actual_report_timestamp = moment(detector.last_alerts_actual_report).unix();

          output.push(detector);
        }

        hell.o("done", "detectors", "info");
        cb(null, output);

      } catch (err) {
        hell.o(err, "detectors", "error");
        cb({name: "Error", status: 400, message: "Error"});
      }

    })(); // async

  };

  monitoring.remoteMethod('detectors', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"},
      {arg: 'req', type: 'object', http: {source: 'req'}}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/detectors', verb: 'get', status: 201}
  });

};
