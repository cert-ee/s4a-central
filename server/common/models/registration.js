'use strict';
const shelljs = require('shelljs');
const fs = require('fs');
const hell = new (require(__dirname + "/helper.js"))({module_name: "registration"});

module.exports = function (registration) {

  const csr_path_unsigned = "/etc/openvpn/keys/"; //[name].csr
  const csr_path_signed = "/etc/openvpn/keys/"; //[name].conf

  /**
   * REGISTRATION FIRST STEP ON CENTRAL SIDE
   *
   * @param first_name
   * @param last_name
   * @param organization_name
   * @param contact_phone
   * @param contact_email
   * @param csr_unsigned
   * @param machine_id
   * @param options
   * @param req
   * @param cb
   */
  registration.request = function (first_name, last_name, organization_name,
                                   contact_phone, contact_email, csr_unsigned,
                                   machine_id, options, req, cb) {
    hell.o( ["start", organization_name ], "request" , "info" );

    let ip_address = "unknown";
    if (req.ip) ip_address = req.ip;

    let temp_detector_name = "UNAPPROVED_" + Math.floor(new Date());
    let registration_info = {
      first_name: first_name,
      last_name: last_name,
      //friendly_name: "UNAPPROVED - " + organization_name,
      friendly_name: "FRIENDLY - " + temp_detector_name,
      organization_name: organization_name,
      contact_phone: contact_phone,
      contact_email: contact_email,
      name: temp_detector_name,
      ip: ip_address,
      machine_id: machine_id,
      csr_unsigned: csr_unsigned,
      last_seen: new Date(),
      registration_status: "Unapproved"
    };

    (async function () {
      try {

        let username = registration_info.name;
        console.log(username);

        hell.o("create detector", "request", "info" );
        let detector_create = await registration.app.models.detector.create(registration_info);
        if (!detector_create) throw new Error("failed to create detector");

        let detector = await registration.app.models.detector.findOne({where: {id: detector_create.id }});
        if (!detector) throw new Error("failed to create detector");
        hell.o(detector, "request", "info");

        let user_input = {username: username, detectorId: detector.id};

        hell.o( "create user for detector", "request", "info" );
        let user = await registration.app.models.user.findOrCreate({where: {username}}, user_input);
        if (!user) throw new Error("failed to create user for detector");
        hell.o( user, "request", "info" );

        let token_info = {ttl: -1, userId: user[0].id, detectorId: detector.id};

        hell.o( "create token for detector", "request", "info" );
        let token = await registration.app.models.AccessToken.create(token_info);
        if (!token) throw new Error("failed to create token for detector");
        hell.o( token, "request", "info" );

        hell.o( "end " + organization_name, "request", "info" );
        return cb(null, {token: token.id, temporary: true, temporary_name: username});

      } catch (err) {
        hell.o( err.message, "request", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('request', {
    accepts: [
      {arg: 'first_name', type: 'string', required: true},
      {arg: 'last_name', type: 'string', required: true},
      {arg: 'organization_name', type: 'string', required: false},
      {arg: 'contact_phone', type: 'string', required: true},
      {arg: 'contact_email', type: 'string', required: true},
      {arg: 'csr_unsigned', type: 'string', required: true},
      {arg: 'machine_id', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"},
      {arg: 'req', type: 'object', http: {source: 'req'}}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/request', verb: 'post', status: 201}
  });

  /**
   * SAVE DETECTOR CSR FOR SIGNING
   *
   * @param input
   * @returns {Promise}
   */
  registration.saveCsrFile = function (input) {
    hell.o( "start", "saveCsrFile", "info" );

    return new Promise((success, reject) => {

      if (process.env.NODE_ENV == "dev") {
        hell.o( "dev mode: return dummy", "saveCsrFile", "info" ); return success(true);
      }

      let file_path = csr_path_unsigned + "" + input.name + ".csr";
      fs.writeFile(file_path, input.csr_unsigned, function (err) {
        if (err) {
          hell.o( err, "saveCsrFile", "error" );
          console.log(err);
          reject(err);
          return;
        }

        hell.o( "csr saved", "saveCsrFile", "info" );
        success(true);
      });

    }); // promise

  };

  /**
   * GET VPN TUNNEL CONTENTS
   *
   * @param input
   * @returns {Promise}
   */
  registration.checkIfCsrIsReady = function (input) {
    hell.o( "start", "checkIfCsrIsReady", "info" );

    return new Promise((success, reject) => {
      setTimeout(function () { // signing is hard work, need to wait a bit

          let file_path = csr_path_signed + "" + input.name + ".conf";
          fs.readFile(file_path, 'utf8', function (err, contents) {
            if (err) {
              hell.o( err, "checkIfCsrIsReady", "error" );
              success(false);
              return;
            }

            hell.o( contents, "checkIfCsrIsReady", "info" );

            success(contents);
          });

      }, 1000);

    }); // promise

  };

  /**
   * CHECK IF CSR FILE HAS BEEN SIGNED
   *
   * csr file will be signed and merged into .conf tunnel file
   * as it takes a x amount of time, poll it
   *
   * @param input
   * @returns {Promise}
   */
  registration.getSignedCsr = function (input) {
    hell.o( "start", "getSignedCsr", "info" );

    return new Promise((success, reject) => {

      if (process.env.NODE_ENV == "dev" ) {
        hell.o( "dev mode: return dummy", "getSignedCsr", "info" ); return success(true);
      }

      let csr_file_result;
      (async function () {
        try {

          for (let i = 0, l = 30; i < l; i++) {
            csr_file_result = await registration.checkIfCsrIsReady(input);
            if (!csr_file_result) {
              hell.o( "no csr/tunnel file, try again in 1000ms " + i, "getSignedCsr", "info" );
              continue;
            } else {
              hell.o( "csr/tunnel conf found, return", "getSignedCsr", "info" );
              success(csr_file_result);
              return;
            }
          }
          throw new Error( input.name + "csr/tunnel conf not found " );

        } catch (err) {
          hell.o( err , "getSignedCsr", "error" );
          reject(err);
        }

      })(); // async

    }); // promise

  };


  /**
   * APPROVE REGISTRATION
   *
   * @param detector_name
   * @param first_name
   * @param last_name
   * @param organization_name
   * @param contact_phone
   * @param contact_email
   * @param friendly_name
   * @param options
   * @param cb
   */
  registration.approve = function (detector_name, first_name, last_name,
                                   organization_name, contact_phone, contact_email,
                                   friendly_name, options, cb) {
    hell.o( [detector_name , "start" ], "approve", "info" );

    (async function () {
      try {

        /*
         GET DETECTOR
         */
        hell.o( "find detector" , "approve", "info" );
        let detector = await registration.app.models.detector.findOne({where: {name: detector_name}, limit: 1});
        if (!detector) throw new Error("detector not found");
        hell.o( detector, "approve", "info" );

        /*
         SAVE CSR FILE
        */
        hell.o( "save csr file for signing", "approve", "info" );
        let save_result = await registration.saveCsrFile({csr_unsigned: detector.csr_unsigned, name: detector.name});
        if (!save_result) throw new Error("failed to save csr file");

        /*
        GET SIGNED CSR/TUNNEL FILE
         */
        hell.o( "get signed csr/tunnel file", "approve", "info" );
        let csr_signed = await registration.getSignedCsr(detector);
        if (!csr_signed) throw new Error("no signed CSR / tunnel file for " + detector.name);
        hell.o( "got tunnel file", "approve", "info" );

        /*
        UPDATE REGISTRATION
         */
        let registration_info = {
          first_name: first_name,
          last_name: last_name,
          organization_name: organization_name,
          contact_phone: contact_phone,
          contact_email: contact_email,
          friendly_name: friendly_name,
          last_seen: new Date(),
          csr_signed: csr_signed,
          registration_status: "Approved",
          activated: true
        };

        hell.o( "update detector registration infromation", "approve", "info" );
        let detector_update = await registration.app.models.detector.update({id: detector.id}, registration_info);
        if (!detector_update) throw new Error("saving updated registration data failed");

        /*
        GET DETECTOR ROLE
         */
        hell.o( "get Detector role", "approve", "info" );
        let detector_role = await registration.app.models.role.find({where: {name: "detector"}});
        if (!detector_role) throw new Error("no detector role found which needs to be added");

        /*
        GET DETECTOR USER
         */
        hell.o( "get detector user", "approve", "info" );
        let detector_user = await registration.app.models.user.find({where: {detectorId: detector.id}});
        if (!detector_user) throw new Error("no detector user found");

        /*
        MAP DETECTOR ROLE TO DETECTOR USER
         */
        let role_input = {
          principalId: detector_user[0].id,
          principalType: "USER",
          roleId: detector_role[0].id
        };
        hell.o( "add role to detector user", "approve", "info" );
        let role_added = await registration.app.models.roleMapping.findOrCreate(role_input);
        if (!role_added) throw new Error("adding detector role to detector user failed");

        /*
        ADD APPROVE JOB TO JOB SCHEDULE
         */
        let job = {
          target: detector_name,
          targetId: detector.id,
          detectorId: detector.id,
          name: "registrationApproved",
          description: "Central has approved this registration"
        };

        hell.o( "add approved job to schedule", "approve", "info" );
        let job_result = await registration.app.models.job_schedule.jobAdd(job);
        if (!job_result) throw new Error("failed to add approve job to schedule, detector will not get updates");
        hell.o( "approve done", "approve", "info" );

        let output = {message: "Detector approved"}
        cb(null, output);

      } catch (err) {
        hell.o( err, "approve", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('approve', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'first_name', type: 'string', required: true},
      {arg: 'last_name', type: 'string', required: true},
      {arg: 'organization_name', type: 'string', required: true},
      {arg: 'contact_phone', type: 'string', required: true},
      {arg: 'contact_email', type: 'string', required: true},
      {arg: 'friendly_name', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/approve', verb: 'post', status: 200}
  });

  /**
   * REJECT REGISTRATION
   *
   * @param detector_name
   * @param options
   * @param cb
   */
  registration.reject = function (detector_name, reject_reason, options, cb) {
    hell.o( [ detector_name, "name" ], "reject", "info" );

    (async function () {
      try {

        /*
         GET DETECTOR
         */
        hell.o( [ detector_name, "get detector" ], "reject", "info" );
        let detector = await registration.app.models.detector.findOne({where: {name: detector_name}, limit: 1});
        if (!detector) throw new Error("detector not found");
        hell.o( detector, "reject", "info" );

        /*
        UPDATE REGISTRATION
         */
        let input = {
          registration_status: "Rejected",
          reject_reason: reject_reason
        };

        hell.o( [ detector_name, "update detector registration to rejected" ], "reject", "info" );
        let detector_update = await registration.app.models.Detector.update({id: detector.id}, input);
        if (!detector_update) throw new Error("update registration data failed");

        /*
        ADD REJECT JOB TO JOB SCHEDULE
         */
        let job = {
          target: detector_name,
          targetId: detector.id,
          detectorId: detector.id,
          name: "registrationRejected",
          description: "Central has reject this registration"
        };

        hell.o( [ detector_name , "add reject job to schedule" ], "reject", "info" );
        let job_result = await registration.app.models.job_schedule.jobAdd(job);
        if (!job_result) throw new Error("failed to add reject job to schedule, detector will not get updates");

        hell.o( "reject done", "reject", "info" );

        let output = {message: "Detector rejected"};
        cb(null, output);

      } catch (err) {
        hell.o( err, "reject", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('reject', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'reject_reason', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/reject', verb: 'post', status: 200}
  });

  /**
   * COMPLETE REGISTRATION REJECT
   *
   * @param options
   * @param cb
   */
  registration.completeRegistrationRejected = function (options, cb) {
    hell.o( "start", "completeRegistrationRejected", "info" );

    (async function () {
      try {

        hell.o( "get detector per token", "completeRegistrationRejected", "info" );
        hell.o( options.accessToken, "completeRegistrationRejected", "info" );
        let detector = await registration.app.models.Detector.findOne({where: {id: options.accessToken.detectorId}});
        if (!detector) throw new Error("can not find detector");
        let detector_name = detector.name;

        let output = {
          registration_status: "Rejected",
          reject_reason: detector.reject_reason
        }

        /*
        GET DETECTOR USER
         */
        hell.o( [ detector_name, "get detector user" ], "completeRegistrationRejected", "info" );
        let detector_user = await registration.app.models.User.find({where: {detectorId: detector.id}});
        if (!detector_user) throw new Error("no user found for detector");
        hell.o( [detector_name, detector_user], "completeRegistrationRejected", "info" );

        /*
        EXPIRE TOKEN
         */
        hell.o( [ detector_name, "get detector user token" ], "completeRegistrationRejected", "info" );
        let token = await registration.app.models.AccessToken.findOne({where: {id: options.accessToken.id}});
        if (!token) throw new Error( detector_name + " failed to get token");
        hell.o( [detector_name , "set token to expire"], "completeRegistrationRejected", "info" );
        let token_expire = await registration.app.models.AccessToken.update({id: token.id}, {ttl: 60});
        if (!token_expire) throw new Error( detector_name + " failed to expire token");

        /*
        DELETE USER
        */
        hell.o( "remove detector user", "completeRegistrationRejected", "info" );
        // let detector_user_delete = await registration.app.models.User.destroyById({ userId: detector_user.id });
        // if (!detector_user_delete) throw new Error("Registration.reject: token user delete failed");

        hell.o( [detector_name, "done"], "completeRegistrationRejected", "info" );
        cb(null, output);
      } catch (err) {
        hell.o( err, "completeRegistrationRejected", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('completeRegistrationRejected', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/completeRegistrationRejected', verb: 'get', status: 200}
  });


  /**
   * COMPLETE REGISTRATION, invoked via jobs
   *
   * get detector based on api token key
   * update token to not temporary
   * return updated registration information
   *
   * @param options
   * @param cb
   */
  registration.completeRegistration = function (options, cb) {
    hell.o( "start", "completed", "info" );

    (async function () {
      try {

        hell.o( "get detector per token", "completed", "info" );
        let detector = await registration.app.models.detector.findOne({where: {id: options.accessToken.detectorId}});
        if (!detector) throw new Error("detector not found");
        hell.o( detector, "completed", "info" );

        hell.o( [ detector.name, "update registration status to completed"], "completed", "info" );
        let detector_update = await registration.app.models.detector.update({id: detector.id}, {registration_status: "Completed"});
        if (!detector_update) throw new Error("failed to save detector status update");

        let output = {
          unique_name: detector.name,
          first_name: detector.first_name,
          last_name: detector.last_name,
          organization_name: detector.organization_name,
          contact_phone: detector.contact_phone,
          contact_email: detector.contact_email,
          csr_signed: detector.csr_signed,
          token: {token: options.accessToken.id, temporary: false},
          message: "Registration approved"
        };

        hell.o( [ detector.name , "done"], "completed", "info" );
        cb(null, output);

      } catch (err) {
        hell.o( err, "completeRegistration", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('completeRegistration', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/completeRegistration', verb: 'get', status: 200}
  });

  /**
   * CHANGE DETECTOR NAME
   *
   * @param old_name
   * @param new_name
   * @param options
   * @param cb
   */
  registration.changeDetectorName = function (old_name, new_name, options, cb) {
    hell.o( [old_name, "start old: " + old_name + " new_name: " + new_name ], "changeDetectorName", "info" );

    if (old_name == new_name) {
      hell.o( "old and new name are the same", "changeDetectorName", "warn" );
      cb(null, {name: new_name});
      return;
    }

    (async function () {

      let User = registration.app.models.User;
      let Detector = registration.app.models.Detector;
      let AccessToken = registration.app.models.AccessToken;

      try {

        if (!/^[a-zA-Z0-9-_.]*$/.test(new_name)) {
          throw new Error( old_name + " detector name contains illegal characters");
        }

        hell.o( [ old_name , " check if new name already exists" ], "changeDetectorName", "info" );
        let detector_check = await Detector.findOne({where: {name: new_name}});
        if (detector_check) throw new Error( old_name + " detector name already exists");

        hell.o( [ old_name, "find detector by old name"], "changeDetectorName", "info" );
        let detector = await Detector.findOne({where: {name: old_name}});
        if (!detector) throw new Error("detector not found");

        hell.o( [ old_name, "update detector name" ], "changeDetectorName", "info" );
        let detector_update = Detector.update({id: detector.id}, {name: new_name});
        if (!detector_update) throw new Error("detector name update failed");

        hell.o( [ old_name , "find detector user" ], "changeDetectorName", "info" );
        let user = await User.findOne({where: {detectorId: detector.id}});
        if (!user) throw new Error("detector user not found");

        hell.o( [ old_name , "update detector user"], "changeDetectorName", "info" );
        let user_update = await User.update({id: user.id}, {username: new_name});
        if (!user_update) throw new Error("detector user name update failed");

        hell.o( [old_name, "find detector user token"], "changeDetectorName", "info" );
        let token = await AccessToken.findOne({where: {userId: user.id}});
        if (!token) throw new Error("detector access token not found");

        hell.o( [ old_name, "update detector user token"], "changeDetectorName", "info" );
        let token_update = await AccessToken.update({id: token.id}, {name: new_name});
        if (!token_update) throw new Error("detector access token update failed");

        hell.o( [old_name, "done, new name: " + new_name], "changeDetectorName", "info" );
        cb(null, {name: new_name});

      } catch (err) {
        hell.o( err, "changeDetectorName", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('changeDetectorName', {
    accepts: [
      {arg: 'old_name', type: 'string', required: true},
      {arg: 'new_name', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/changeDetectorName', verb: 'post', status: 200}
  });

  /**
   * RENEW TOKEN FOR DETECTOR
   *
   * feature not implemented
   *
   * @param options
   * @param cb
   */
  registration.rollToken = function (options, cb) {
    hell.o( "start", "rollToken", "info" );

    let AccessToken = registration.app.models.AccessToken;

    (async function () {
      try {

        hell.o( "find old token per request token", "rollToken", "info" );
        let old_token = await AccessToken.findOne({where: {id: options.accessToken.id}});
        if (!old_token) throw new Error("failed to get old token");
        hell.o( old_token, "rollToken", "info" );

        let token_info = {ttl: -1, userId: old_token.userId, detectorId: old_token.detectorId};

        hell.o( [ old_token.detectorId, "create a new token" ], "rollToken", "info" );
        let new_token = await AccessToken.create(token_info);
        if (!new_token) throw new Error( old_token.detectorId + " failed to create a new token");

        let old_token_expire = await AccessToken.update({id: old_token.id}, {ttl: 6000});
        if (!old_token_expire) throw new Error( old_token.detectorId + " failed to expire old token");

        //let token_update = await AccessToken.update({id: token.id}, {name: new_name});
        //if (!token_update) throw new Error("Detector access token update failed");
        let output = {token: new_token.id, temporary: false};

        cb(null, output);
      } catch (err) {
        hell.o( err, "rollToken", "error" );
        cb({ name:"Error", status: 400, message: err.message });
      }

    })(); // async

  };

  registration.remoteMethod('rollToken', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/rollToken', verb: 'get', status: 200}
  });

};
