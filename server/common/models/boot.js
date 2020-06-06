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

      let versions_load = util.promisify(boot.app.models.system_info.version);
      let versions = await versions_load();
      let installer_version = parseInt(versions.main.replace(/[^0-9]/g, ''));
      hell.o(["this product package version: ", installer_version], "boot", "info");

      hell.o("find", "boot", "info");
      let system_info_result = await boot.app.models.system_info.findOne({name: "update_version"});
      if (!system_info_result) {
        hell.o("not found", "boot", "info");
        hell.o(system_info_result, "boot", "info");

        system_info_result = await boot.app.models.system_info.create(
          {name: "update_version", friendly_name: "App version", description: "", data: installer_version}
        );
        system_info_result = await boot.app.models.system_info.findOne({where: {name: "update_version"}});
      }

      let database_installer_version = system_info_result.data;

      hell.o([database_installer_version, installer_version], "boot", "info");

      if (database_installer_version === undefined || database_installer_version < installer_version) {
        hell.o("start updates check", "boot", "info");
        hell.o(["package json", installer_version], "boot", "info");
        hell.o(["system_info.update_version", database_installer_version], "boot", "info");

        let something_to_update = false;
        if (database_installer_version <= 168) {
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
            {name: "update_version", friendly_name: "App version", description: "", data: installer_version}
          );
        }
        if (database_installer_version <= 2128) {
          something_to_update = true;
          hell.o("settings rebuild", "boot", "info");
          await boot.app.models.tasker.destroyAll();
          await boot.app.models.task.destroyAll();
          await boot.app.models.settings.destroyAll();
          await boot.app.models.yara.destroyAll();
          await boot.app.models.wise.destroyAll();
        }

        if (database_installer_version <= 2144) {
          something_to_update = true;
          hell.o("restructure offline checker", "boot", "info");
          let offline_tasker = await boot.app.models.tasker.findOne({where: {name: "detector_offline_checker"}});
          await boot.app.models.tasker.task_unloader(offline_tasker);
          await boot.app.models.tasker.destroyById(offline_tasker.id);
        }

        if (database_installer_version <= 2153) {
          hell.o("update test", "boot", "info");
        }

        if (database_installer_version <= 2182) {
          something_to_update = true;
          hell.o("update ruleset model with skip_review and force_disabled", "boot", "info");
          let rulesets = await boot.app.models.ruleset.find();
          for (const rs of rulesets) {
            await boot.app.models.ruleset.update({name: rs.name}, {
              skip_review: rs.automatically_enable_new_rules,
              force_disabled: false
            });
          }
          hell.o("do some defaulting for rules");
          let rules = await boot.app.models.rule.find(), temp_rule;
          for (const r of rules) {

            temp_rule = {
              sid: r.sid,
              revision: r.revision,
              classtype: r.classtype,
              severity: r.severity,
              ruleset: r.ruleset,
              enabled: r.enabled,
              message: r.message,
              rule_data: r.rule_data,
              force_disabled: r.force_disabled || false,
              feed_name: false,
              primary: false
            };

            await boot.app.models.rule.update({id: r.id}, temp_rule);
          }
          hell.o("---", "boot", "info");
        }

        if (!something_to_update) {
          hell.o("currently no updates", "boot", "info");
        }

      }

      hell.o(["save update / patch level", installer_version], "boot", "info");
      await boot.app.models.system_info.update({name: "update_version"}, {data: installer_version});

      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };

};
