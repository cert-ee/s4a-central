'use strict';
const util = require('util');
const hell = new (require(__dirname + "/helper.js"))({module_name: "boot"});

module.exports = function (boot) {

  /**
   * INITIALIZE BOOT
   *
   * create defaults
   */
  boot.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      //this also builds indexes
      let check_for_data_models_changes = await boot.app.dataSources.db.autoupdate();

      hell.o("connect to mongo to check indexes", "initialize", "info");
      let index_result = await boot.app.dataSources.db.connector.connect(function (err, db) {
        if (err) throw new Error("could not connect to mongo");
        let collection;
        collection = db.collection('tagrule');
        collection.createIndex({"ruleId": 1});

        collection = db.collection('tagruleset');
        collection.createIndex({"rulesetId": 1});
        collection.createIndex({"tagId": 1});

        hell.o("index check done", "initialize", "info");
      });

      let versions_load = util.promisify(boot.app.models.system_info.version);
      let versions = await versions_load();
      let server_numbers = parseInt(versions.server.replace(/[^0-9]/g, ''));
      hell.o(["this product server version: ", server_numbers], "boot", "info");

      hell.o("find", "boot", "info");
      let system_info_result = await boot.app.models.system_info.findOne({name: "update_version"});
      if (!system_info_result) {
        hell.o("not found", "boot", "info");
        hell.o(system_info_result, "boot", "info");

        system_info_result = await boot.app.models.system_info.create(
          {name: "update_version", friendly_name: "App version", description: "", data: server_numbers}
        );
        system_info_result = await boot.app.models.system_info.findOne({where: {name: "update_version"}});
      }

      hell.o([system_info_result.data, server_numbers], "boot", "info");

      if (system_info_result.data === undefined || system_info_result.data < server_numbers) {
        hell.o("start updates check", "boot", "info");
        hell.o(["package json", server_numbers], "boot", "info");
        hell.o(["system_info.update_version", system_info_result.data], "boot", "info");

        let something_to_update = false;
        if (server_numbers <= 168) {
          something_to_update = true;
          hell.o("need to destroy old feeds n settings", "boot", "info");
          await boot.app.models.feed.destroyAll();
          await boot.app.models.settings.destroyAll();
          await boot.app.models.tasker.destroyAll();
          await boot.app.models.feed.destroyAll();
          await boot.app.models.task.destroyAll();
          await boot.app.models.yara.destroyAll();
          await boot.app.models.wise.destroyAll();
          await boot.app.models.system_info.destroyAll();
          await boot.app.models.system_info.create(
            {name: "update_version", friendly_name: "App version", description: "", data: server_numbers}
          );
        }
        if (server_numbers <= 2128) {
          something_to_update = true;
          hell.o("settings rebuild", "boot", "info");
          await boot.app.models.tasker.destroyAll();
          await boot.app.models.task.destroyAll();
          await boot.app.models.settings.destroyAll();
          await boot.app.models.yara.destroyAll();
          await boot.app.models.wise.destroyAll();
        }

        if (server_numbers <= 2144) {
          hell.o("restructure offline checker", "boot", "info");
          let offline_tasker = await boot.app.models.tasker.findOne({where: {name: "detector_offline_checker"}});
          await boot.app.models.tasker.task_unloader(offline_tasker);
          await boot.app.models.tasker.destroyById(offline_tasker.id);
        }

        if (!something_to_update) {
          hell.o("currently no updates", "boot", "info");
        }

      }

      hell.o(["save update / patch level", server_numbers], "boot", "info");
      await boot.app.models.system_info.update({name: "update_version"}, {data: server_numbers});

      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };

};
