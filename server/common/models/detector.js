'use strict';

const hell = new (require(__dirname + "/helper.js"))({module_name: "detector"});

module.exports = function (detector) {

  /**
   * GET CURRENT DETECTOR TOKEN
   *
   * @param options
   * @param cb
   */
  detector.currentToken = function (detectorId, options, cb) {
    hell.o(["start", detectorId], "currentToken", "info");

    let AccessToken = detector.app.models.AccessToken;

    (async function () {
      try {

        let token = await AccessToken.findOne({where: {detectorId: detectorId}});
        if (!token) throw new Error("could not find token");
        // hell.o(["token", token], "currentToken","info");

        let output = {token: token.id};
        cb(null, output);

      } catch (err) {
        hell.o(err, "currentToken", "info");
        cb({name: "Error", status: 400, message: err});
      }

    })(); // async

  };

  detector.remoteMethod('currentToken', {
    accepts: [
      {arg: 'detectorId', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/currentToken', verb: 'get', status: 200}
  });

  /**
   * DELETE DETECTOR
   *
   * @param detectorId
   * @param options
   * @param cb
   */
  detector.deleteDetector = function (detectorId, options, cb) {
    hell.o("start", "deleteDetector", "info");

    (async function () {
      try {

        hell.o([detectorId, "detectorId"], "deleteDetector", "info");
        let current = await detector.findOne({where: {id: detectorId}});
        if (!current) throw new Error("can not find detector");
        let detector_name = current.name;

        /*
        GET DETECTOR USER
         */
        hell.o([detector_name, "get detector user"], "deleteDetector", "info");
        let detector_user = await detector.app.models.User.findOne({where: {detectorId: detectorId}});
        if (!detector_user) throw new Error("failed to find detector user");
        hell.o([detector_name, detector_user], "deleteDetector", "info");


        /*
         EXPIRE AND REMOVE TOKENS
          */
        hell.o([detector_name, "get detector user token"], "deleteDetector", "info");
        let tokens = await detector.app.models.AccessToken.find({where: {detectorId: detectorId}});
        // if (!tokens) throw new Error(receiver_name + " failed to get token");
        for (let token of tokens) {
          hell.o([detector_name, "set token to expire"], "deleteReceiver", "info");
          let token_expire = await detector.app.models.AccessToken.update({id: token.id}, {ttl: 60});
          if (!token_expire) throw new Error(detector_name + " failed to expire token");
          hell.o([detector_name, "destroy token"], "deleteReceiver", "info");
          let token_remove = await detector.app.models.AccessToken.destroyById(token.id);
          if (!token_remove) throw new Error(detector_name + " failed to delete token");
        }

        /*
        REMOVE RECEIVER ROLES
         */
        hell.o("remove receiver roles", "afterSave", "info");
        let roles = await detector.app.models.roleMapping.find({where: {principalId: detectorId}});
        for (let role of roles) {
          let role_remove = await detector.app.models.roleMapping.destroyById(role.id);
        }

        /*
        DELETE USER
        */
        hell.o("remove detector user", "deleteDetector", "info");
        let detector_user_delete = await detector.app.models.User.destroyById(detector_user.id);
        if (!detector_user_delete) throw new Error("Registration.reject: token user delete failed");

        /*
        DELETE DETECTOR
         */
        hell.o([detectorId, "delete detector"], "deleteDetector", "info");
        let delete_result = await current.destroy();
        if (!delete_result) throw new Error("failed to delete detector");

        hell.o([detector_name, "done"], "deleteDetector", "info");
        return cb(null, {"name": detector_name});
      } catch (err) {
        hell.o(err, "deleteDetector", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })();

  };

  detector.remoteMethod('deleteDetector', {
    accepts: [
      {arg: 'detectorId', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/deleteDetector', verb: 'post', status: 200}
  });

  /**
   * CHECK FOR OFFLINE DETECTORS
   *
   * @param cb
   */
  detector.checkOffline = async function () {
    hell.o("start", "checkOffline", "info");

    try {

      //current timeout for detector is 12 minutes, which we consider offline
      let filter_time = new Date();
      filter_time.setMinutes(filter_time.getMinutes() - 12);

      let all_detectors = await detector.find({fields: ["id", "last_seen", "online"]});

      let offline_detectors = 0;
      for (let i = 0, l = all_detectors.length; i < l; i++) {
        if (all_detectors[i].online && new Date(all_detectors[i].last_seen) < filter_time) {
          let update_result = await detector.update({id: all_detectors[i].id}, {online: false});
          hell.o([update_result, " offline"], "task", "info");
          offline_detectors++;
        }
      }

      let output = {logs: ""};

      if (offline_detectors == 0) {
        hell.o(["no new offline detectors found"], "checkOffline", "info");
        // return cb(null, {message: "ok"});
        output = {logs: "no new offline detectors found"};
        return output;
      }

      hell.o([offline_detectors, " detectors set to offline"], "checkOffline", "info");
      output = {logs: offline_detectors + " detectors set to offline"};

      hell.o("done", "checkOffline", "info");
      return output;
    } catch (err) {
      hell.o(err, "checkOffline", "error");
      return cb({name: "Error", status: 400, message: err.message});
    }

  };


  /**
   * CHECK THAT DETECTORS HAVE RULES ENABLED
   *
   * @param cb
   */
  detector.checkRules = async function () {
    hell.o("start", "checkRules", "info");

    try {

      let all_detectors = await detector.find({fields: ["id", "rules_count_enabled", "rules_count"]});
      // console.log(all_detectors);

      for (let current of all_detectors) {
        // console.log(current)
        if (current.rules_count > 0 && current.rules_count_enabled > 0) {
          // console.log("rules OK for ", current.id);
        } else {
          hell.o(["rules NOK for ", current], "checkRules", "info");
        }
      }

      let output = {logs: ""};

      hell.o("done", "checkRules", "info");
      return output;
    } catch (err) {
      hell.o(err, "checkRules", "error");
      return cb({name: "Error", status: 400, message: err.message});
    }

  };

  /**
   * TASKS
   *
   * checks:
   * offline
   * rule_count
   * alert_activity
   *
   * @param cb
   */
  detector.tasks = {};
  detector.task = async function (input, cb) {
    hell.o("start", "task", "info");
    // console.log(input);
    try {

      if (input.check_name == "offline") {
        let offline_check = await detector.checkOffline();
        return cb(null, {message: "ok", logs: offline_check.logs});
      }

      if (input.check_name == "rule_count") {
        let rules_check = await detector.checkRules();
        return cb(null, {message: "ok", logs: rules_check.logs});
      }

      hell.o(["done", " done"], "task", "info");

      return cb(null, {message: "ok"});
    } catch (err) {
      hell.o(err, "task", "error");
      return cb({name: "Error", status: 400, message: err.message});
    }

  };

};
