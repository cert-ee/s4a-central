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
    hell.o(["start", detectorId], "currentToken");

    let AccessToken = detector.app.models.AccessToken;

    (async function () {
      try {

        let token = await AccessToken.findOne({where: {detectorId: detectorId}});
        if (!token) throw new Error("could not find token");
        hell.o(["token", token], "currentToken");

        let output = {token: token.id};
        cb(null, output);

      } catch (err) {
        hell.o(err, "currentToken");
        detector.logger(err, "currentToken", "error");
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
        EXPIRE TOKEN
         */
        hell.o([detector_name, "get detector user token"], "deleteDetector", "info");
        let token = await detector.app.models.AccessToken.findOne({where: {id: options.accessToken.id}});
        if (!token) throw new Error(detector_name + " failed to get token");
        hell.o([detector_name, "set token to expire"], "deleteDetector", "info");
        let token_expire = await detector.app.models.AccessToken.update({id: token.id}, {ttl: 60});
        if (!token_expire) throw new Error(detector_name + " failed to expire token");

        /*
        DELETE USER
        */
        hell.o("remove detector user", "deleteDetector", "info");
        // let user_delete = detector_user.destroy();
        // if (!user_delete) throw new Error("failed to delete detector user");
        // let detector_user_delete = await detector.app.models.User.destroyById({ userId: detector_user.id });
        // if (!detector_user_delete) throw new Error("Registration.reject: token user delete failed");

        hell.o([detectorId, "delete detector"], "deleteDetector", "info");
        //let delete_result = await detector.destroyById({detectorId});
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
  detector.task = async function (input,cb) {
    hell.o("start", "task", "info");

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

      if (offline_detectors == 0) {
        hell.o(["no new offline detectors found"], "task", "info");

        return cb(null, {message: "ok"});
      }

      hell.o([offline_detectors, " detectors set to offline"], "task", "info");

      return cb(null, {message: "ok"});
    } catch (err) {
      hell.o(err, "task", "error");
      return cb({name: "Error", status: 400, message: err.message});
    }

  };

};
