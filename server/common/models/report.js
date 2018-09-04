'use strict';

const fs = require('fs');
const hell = new (require(__dirname + "/helper.js"))({module_name: "report"});

module.exports = function (report) {

  const URL_FEEDBACK_FAQ = process.env.URL_FEEDBACK_FAQ;
  const PATH_SURICATA_ALERTS = process.env.PATH_SURICATA_ALERTS;

  /**
   * STATUS from detectors
   *
   * @param options
   * @param cb
   */
  report.status = function (detector_info, options, req, cb) {
    hell.o("start", "status", "info");

    let token_detector = options.accessToken.detectorId;
    hell.o(token_detector, "status", "info");

    (async function () {
      try {

        let Detector = report.app.models.Detector;
        let JobSchedule = report.app.models.JobSchedule;

        hell.o([ token_detector, "find detector"], "status", "info");
        let current_detector = await Detector.findOne({where: {id: token_detector}});
        if (!current_detector) throw new Error("failed to find detector");

        //detector components info
        let components_overall_ok = true;
        for (let comp of detector_info.components) {
          if (!comp.status) components_overall_ok = false;
        }

        let update_detector = {
          last_seen: new Date(),
          online: true,
          components: detector_info.components,
          components_overall: components_overall_ok
        };

        hell.o([ token_detector, "update detector"], "status", "info");
        let update_result = await Detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error( token_detector + " failed to update detector status");

        hell.o([ token_detector, "check jobs"], "status", "info");
        let job_queue = await JobSchedule.find({
          where: {detectorId: token_detector, transferred: false, completed: false},
          fields: ["id", "name"]
        });
        if (!job_queue) throw new Error( token_detector + " failed to get detector job queue");

        let output = {
          job_queue: job_queue
        };

        if (job_queue.length == 0) { //no jobs to report back
          cb(null, output);
          return;
        }

        hell.o([ token_detector, "jobs"], "status", "info");
        let job_update = {transferred: true, transferred_time: new Date()};

        for (let i = 0, l = job_queue.length; i < l; i++) {
          hell.o([ token_detector, "update job " + job_queue[i].name ], "status", "info");
          let job_transferred = await JobSchedule.update({id: job_queue[i].id}, job_update);
          if (!job_transferred) throw new Error("failed to update job status");
        }

        output = {
          job_queue: job_queue
        };

        hell.o([ token_detector, "done" ], "status", "info");

        cb(null, output);

      } catch (err) {
        hell.o([ token_detector, "done" ], "status", "error");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  };

  report.remoteMethod('status', {
    accepts: [
      {arg: "detector_info", type: "object", required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"},
      {arg: 'req', type: 'object', http: {source: 'req'}}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/status', verb: 'post', status: 201}
  });

  /**
   * JOB / TASK DONE from detector
   *
   * @param options
   * @param cb
   */
  report.jobDone = function (job_id, job, options, cb) {
    hell.o( "start", "jobDone", "info");

    let token_detector = options.accessToken.detectorId;
    hell.o([ token_detector, "start" ], "jobDone", "info");

    (async function () {
      try {

        let update_detector = {last_seen: new Date(), online: true};

        hell.o([ token_detector, "update detector"], "jobDone", "info");
        let update_result = await Detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error( token_detector + " failed to update detector status");

        let update_job = {completed: true, completed_time: new Date()};

        hell.o([ token_detector, "update job"], "jobDone", "info");
        update_result = await report.app.models.JobSchedule.update({id: job_id}, update_job);
        if (!update_result) throw new Error("failed to update job");

        hell.o([ token_detector, "done"], "jobDone", "info");
        cb(null, {message: "ok"});
      } catch (err) {
        hell.o( err, "jobDone", "error");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  }

  report.remoteMethod('jobDone', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'name', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/jobDone', verb: 'post', status: 201}
  });

  /**
   * FEEDBACK HANDLER
   *
   * @param message
   * @param comment
   * @param machine_id
   * @param detector_logs
   * @param system_info
   * @param network_interfaces
   * @param components
   * @param contacts
   * @param extra
   * @param options
   * @param cb
   */
  report.feedback = function (message, comment, machine_id, detector_logs, system_info, network_interfaces, components,
                              contacts, extra, options, cb) {
    hell.o( "start", "feedback", "info");

    (async function () {
      try {

        let count = await report.app.models.feedback.count();
        if (!count && count !== 0 ) throw new Error("failed to create new case number");

        let case_number = count + 1;

        let feedback_input = {
          case_number: case_number,
          machine_id: machine_id,
          message: message,
          comment: comment,
          logs: detector_logs,
          system_info: system_info,
          network_interfaces: network_interfaces,
          components: components,
          contacts: contacts,
          extra: extra,
        };

        if( options.accessToken && options.accessToken.detectorId ) {
          feedback_input.detectorId = options.accessToken.detectorId;
        }

        //hell.o( feedback_input, "feedback", "info");

        hell.o( "save feedback", "feedback", "info");
        let insert_result = await report.app.models.feedback.create(feedback_input);
        if (!insert_result) throw new Error("failed to save feedback");

        hell.o( "done", "feedback", "info");
        let output = {case_number: case_number, faq_url: URL_FEEDBACK_FAQ};
        cb(null, output);

      } catch (err) {
        console.log ("TERE", options.accessToken );
        hell.o( err, "feedback", "info");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  };

  report.remoteMethod('feedback', {
    accepts: [
      {arg: 'message', type: 'string', required: true},
      {arg: 'comment', type: 'string', required: false},
      {arg: 'machine_id', type: 'string', required: false},
      {arg: 'logs', type: 'object', required: false},
      {arg: 'system_info', type: 'object', required: false},
      {arg: 'network_interfaces', type: 'array', required: false},
      {arg: 'components', type: 'array', required: false},
      {arg: 'contacts', type: 'object', required: false},
      {arg: 'extra', type: 'object', required: false},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/feedback', verb: 'post', status: 201}
  });

  /**
   * RULES CHECK from detector
   *
   * @param last_update
   * @param options
   * @param cb
   */
  report.rules = function (last_rules_update, options, cb) {
    hell.o( "start", "rules", "info");

    let token_detector = options.accessToken.detectorId;
    hell.o( token_detector, "rules", "info");

    (async function () {
      try {

        let update_detector = {last_seen: new Date(), online: true};

        hell.o( [ token_detector, "update status" ], "rules", "info");
        let update_result = await report.app.models.detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error("failed to update detector status");

        hell.o( [ token_detector, "check if new rules" ], "rules", "info");
        let rules_to_update = await report.app.models.rule.checkNewRulesForDetector(token_detector, last_rules_update);
        if (!rules_to_update) throw new Error("failed to check rules");

        hell.o( [ token_detector, "done" ], "rules", "info");
        let output = {rules: rules_to_update};
        cb(null, output);

      } catch (err) {
        hell.o( err, "rules", "error");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  };

  report.remoteMethod('rules', {
    accepts: [
      {arg: 'last_rules_update', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/rules', verb: 'post', status: 201}
  });


  /**
   * YARA CHECK from detector
   *
   * @param detector_checksum
   * @param options
   * @param cb
   */
  report.yara = function (detector_checksum, options, cb) {
    hell.o( "start", "yara", "info");

    let token_detector = options.accessToken.detectorId;
    hell.o( token_detector, "yara", "info");

    (async function () {
      try {

        let update_detector = {last_seen: new Date(), online: true};

        hell.o( [ token_detector, "update status" ], "rules", "info");
        let update_result = await report.app.models.detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error("failed to update detector status");

        let yara_busy = await report.app.models.yara.findOne({ where: { name: "busy"} });
        if( yara_busy.data === "true" ){
          hell.o( "Yara busy", "yara", "warning");
          return cb({name: "Error", status: 503, message: "Central busy"}); //?
        }

        /*
        output = { checksum: "", yara: "" };
         */
        let output = await report.app.models.yara.checkForDetector( detector_checksum );

        //TODO mark yara as updated for detector

        hell.o( [ token_detector, "done" ], "yara", "info");

        cb(null, output);
      } catch (err) {
        hell.o( err, "yara", "error");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  };

  report.remoteMethod('yara', {
    accepts: [
      {arg: 'checksum', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/yara', verb: 'post', status: 201}
  });

  /**
   * WISE CHECK from detector
   *
   * @param detector_checksum
   * @param options
   * @param cb
   */
  report.wise = function (detector_checksum, options, cb) {
    hell.o( "start", "wise", "info");

    let token_detector = options.accessToken.detectorId;
    hell.o( token_detector, "wise", "info");

    (async function () {
      try {

        let update_detector = {last_seen: new Date(), online: true};

        hell.o( [ token_detector, "update status" ], "rules", "info");
        let update_result = await report.app.models.detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error("failed to update detector status");

        let wise_busy = await report.app.models.wise.findOne({ where: { name: "busy"} });
        if( wise_busy.data === "true" ){
          hell.o( "wise busy", "wise", "warning");
          return cb({name: "Error", status: 503, message: "Central busy"}); //?
        }
        /*
        output = { checksum: "", wise_ip: "", wise_url: "", wise_domain: "" };
         */
        let output = await report.app.models.wise.checkForDetector( detector_checksum );

        //TODO mark wise as updated for detector

        hell.o( [ token_detector, "done" ], "wise", "info");

        cb(null, output);
      } catch (err) {
        hell.o( err, "wise", "error");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  };

  report.remoteMethod('wise', {
    accepts: [
      {arg: 'checksum', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/wise', verb: 'post', status: 201}
  });

  /**
   * SAVE ALERTS TO DISK
   *
   * @param input
   * @returns {Promise}
   */
  report.saveAlerts = function (input) {
    let token_detector = input.token_detector;
    hell.o( [ token_detector, "start" ], "saveAlerts", "info");

    return new Promise((success, reject) => {

      if (input.alerts.length == 0){
        hell.o( [ token_detector, "no alerts" ], "saveAlerts", "error");
        return reject("no alerts");
      }

      let ok_timestamp = 0, alert, alert_input, count=0;
      for (let id = 0; id < input.alerts.length; id++) {

        if( ! input.alerts[id].hasOwnProperty("_source") ) continue;

        alert = input.alerts[id]._source;

        if( alert === undefined ) return;

        if( alert.hasOwnProperty("@timestamp") ) {
          delete alert["@timestamp"];
        }
        alert["host_id"] = input.name;

        alert_input = JSON.stringify(alert) + "\n";

        fs.appendFileSync( PATH_SURICATA_ALERTS, alert_input, function (err) {
          if (err) {
            // let write_error = new Error("Unable to accept data at this time");
            // write_error.timestamp = alarm._timestamp;
            // write_error.statusCode = 518;
            // cb(write_error);
            hell.o( [ token_detector, "failed to save to disk" ], "saveAlerts", "error");
            return reject(err);
          } else {
            count++;
            ok_timestamp = alert._timestamp;
          }
        });

      } // for loop

      hell.o( [ token_detector, "saved to disk" ], "saveAlerts", "info");

      let output = {
        timestamp: ok_timestamp,
        count: count
      };
      success( output );

    }); // promise

  };

  /**
   * ALERTS from detector
   *
   * @param alerts
   * @param options
   * @param cb
   */

  report.alerts = function (alerts, options, cb) {
    hell.o( "start", "alerts", "info");

    let token_detector = options.accessToken.detectorId;
    hell.o([ token_detector, "token" ], "alerts", "info");

    (async function () {
      try {

        let update_detector = {last_seen: new Date(), online: true};

        hell.o( [ token_detector, "update status" ], "alerts", "info");
        let update_result = await report.app.models.detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error("failed to update status");

        if (alerts.length == 0) {
          hell.o( [ token_detector, "no rules posted" ], "rules", "info");
          return cb({name: "Error", status: 400, message: "No alerts"});
        }

        hell.o( [ token_detector, "find detector" ], "rules", "info");
        let detector = await report.app.models.detector.find({ where: {id: token_detector} });
        if (!detector[0]) throw new Error("failed to find detector");
        detector = detector[0];
        hell.o( [ token_detector, detector.name ], "rules", "info");
        hell.o( [ token_detector, detector.friendly_name ], "rules", "info");

        hell.o( [ token_detector, "save alerts" ], "rules", "info");
        let update_alerts_file = await report.saveAlerts({alerts: alerts, name: detector.name, token_detector: token_detector});
        if (!update_alerts_file) throw new Error("failed to save alerts on disk");

        hell.o( [ token_detector, "done" ], "rules", "info");
        cb(null, {message: "ok", data: update_alerts_file });

      } catch (err) {
        hell.o( err, "rules", "error");
        cb({name: "Error", status: 400, message: "Central failed to process the request"});
      }

    })(); // async

  };

  report.remoteMethod('alerts', {
    accepts: [
      {arg: 'alerts', type: 'array', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/alerts', verb: 'post', status: 201}
  });

  /**
   * ALERTS MANUAL from detector
   *
   * feature not implemented yet
   *
   * @param alerts
   * @param options
   * @param cb
   */
  report.alertsManual = function (alerts, options, cb) {
    hell.o( "start", "alertsManual", "info");

    if( process.env.NODE_ENV !== "dev" ) {
      hell.o("ENV is not DEV, fail", "alertsManual", "warn");
      cb("error");
      return false;
    }

    let token_detector = options.accessToken.detectorId;
    hell.o( [ token_detector, "start" ], "alertsManual", "info");

    (async function () {
      try {

        hell.o( [ token_detector, "update detector" ], "alertsManual", "info");
        let update_detector = {last_seen: new Date(), online: true};
        let update_result = await report.app.models.detector.update({id: token_detector}, update_detector);
        if (!update_result) throw new Error("failed to update detector");

        if (alerts.length == 0) {
          hell.o( [ token_detector, "no alerts" ], "alertsManual", "error");
          return cb({name: "Error", status: 400, message: "No alerts"});
        }

        hell.o( [ token_detector, "find detector" ], "alertsManual", "info");
        let detector = await report.app.models.detector.findOne({id: token_detector});
        if (!detector) throw new Error("failed to find detector");
        console.log( detector.name );

        hell.o( [ token_detector, "save to disk" ], "alertsManual", "info");
        let update_alerts_file = await report.saveAlerts({alerts: alerts, name: detector.name});
        if (!update_alerts_file) throw new Error("failed to save alerts on disk");

        hell.o( [ token_detector, "done" ], "alertsManual", "info");
        cb(null, {message: "ok", data: update_alerts_file });

      } catch (err) {
        hell.o( err, "alertsManual", "info");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  report.remoteMethod('alertsManual', {
    accepts: [
      {arg: 'alerts', type: 'array', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/alertsManual', verb: 'post', status: 201}
  });

};
