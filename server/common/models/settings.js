'use strict';
const fs = require('fs');
const shelljs = require('shelljs');
const hell = new (require(__dirname + "/helper.js"))({module_name: "settings"});

module.exports = function (settings) {

  /**
   * INITIALIZE SETTINGS
   *
   * create defaults
   */
  settings.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      // create settings with defaults
      let current_settings = await settings.findOrCreate({});

      // console.log( "current_settings" );
      // console.log( current_settings );

      let found_settings = current_settings[0];
      // console.log( found_settings );

      const PATH_BASE = process.env.PATH_BASE;

      if (!PATH_BASE) throw new Error("env missing: PATH_BASE");

      let exists = await fs.existsSync(PATH_BASE);
      if (!exists) {
        throw new Error("path does not exist: " + PATH_BASE);
      }

      if (found_settings.path_content_base !== PATH_BASE) {
        hell.o(["going to update path_content_base from env", found_settings.path_content_base, PATH_BASE], "initialize", "info");

        let update_paths = {
          path_content_base: PATH_BASE,
          path_suricata_content: PATH_BASE + "suricata/",
          path_moloch_content: PATH_BASE + "moloch/",
          path_moloch_yara: PATH_BASE + "moloch/yara/",
          path_moloch_wise_ip: PATH_BASE + "moloch/wise_ip/",
          path_moloch_wise_ja3: PATH_BASE + "moloch/wise_ja3/",
          path_moloch_wise_url: PATH_BASE + "moloch/wise_url/",
          path_moloch_wise_domain: PATH_BASE + "moloch/wise_domain/"
        };

        await settings.update({id: found_settings.id}, update_paths);

      }

      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };


  /**
   * AFTER SAVING A SETTING RELOAD SOME MODELS
   *
   */
  settings.observe('after save', async (ctx) => {
    if (ctx.isNewInstance === undefined) return Promise.resolve();
    hell.o(["start", ctx.instance.id], "afterSave", "info");

    try {

      // console.log("CTX: ");
      // console.log(ctx.instance);
      // let current_settings = await settings.findOne({where: {id: ctx.instance.id}});

      //RECREATE MAILER
      hell.o(["start", "notify.initializeMailer"], "afterSave", "info");
      await settings.app.models.notify.initializeMailer();

      hell.o(["done", ctx.instance.id], "afterSave", "info");
      return Promise.resolve();
    } catch (err) {
      hell.o(err, "afterSave", "error");

      return Promise.resolve();
    }

  });


  /**
   * RESET FUNCTION
   *
   * for development
   *
   * @param options
   * @param cb
   */
  settings.resetApp = async function (options, cb) {
    hell.o("start", "resetApp", "warn");

    if (process.env.NODE_ENV !== "dev") {
      hell.o("ENV is not DEV, fail", "resetApp", "warn");
      cb("error");
      return false;
    }

    try {

      hell.o("destroy database", "resetApp", "warn");
      await settings.app.models.detector.destroyAll();
      await settings.app.models.accessToken.destroyAll();
      await settings.app.models.feed.destroyAll();
      await settings.app.models.feedback.destroyAll();
      await settings.app.models.tag.destroyAll();
      await settings.app.models.rule.destroyAll();
      await settings.app.models.rule_draft.destroyAll();
      await settings.app.models.ruleset.destroyAll();
      await settings.app.models.role.destroyAll();
      await settings.app.models.roleMapping.destroyAll();
      await settings.app.models.user.destroyAll();
      await settings.app.models.log.destroyAll();
      await settings.app.models.tasker.destroyAll();
      await settings.app.models.task.destroyAll();
      await settings.destroyAll();

      let output = {message: "reset done"};

      cb(null, output);

      hell.o("restart proccess", "resetApp", "warn");
      if (process.env.NODE_ENV == "dev") {
        hell.o("restart nodemon", "resetApp", "warn");
        shelljs.touch("server.js"); // kick nodemon
      } else {
        hell.o("pm2 restart", "resetApp", "warn");
        //process.exit(1); //pm2
      }

    } catch (err) {
      hell.o(err, "resetApp", "error");
      cb({name: "Error", status: 400, message: err.message});
    }

  };

  settings.remoteMethod('resetApp', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/resetApp', verb: 'get', status: 200}
  });

};
