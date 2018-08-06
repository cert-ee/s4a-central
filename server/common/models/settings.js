'use strict';
const hell = new (require(__dirname + "/helper.js"))({module_name: "settings"});

module.exports = function (settings) {

  /**
   * UPDATE SETTING and reload
   *
   * @param name
   * @param value
   * @param cb
   * @returns {Promise}
   */
  settings.updateSetting = function (name, value, cb) {
    hell.o(["update setting", "start name: " + name + " value: " + value], "updateSetting", "info");

      (async function () {
        try {

          let sett = await settings.findOne({where: {id: "settingid"}});
          if (!sett) throw new Error("failed to load settings");

          let setts = Object.keys(sett);
          delete setts.id;

          if (!setts.includes(name)) throw new Error("illegal setting: " + name);
          if (sett[name] == value) return cb({name: "Error", status: 400, message: "no_changes"});

          /*
          Update
           */
          let update_input = {};
          update_input[name] = value;
          let update_result;

          hell.o( [name, "update database" ], "updateSetting", "info");
          update_result = await settings.update({id: "settingid"}, update_input);
          if (!update_result) throw new Error(name + " update failed");

          /*
          Reload settings
           */
          await settings.initialize(null, function () {
            hell.o( [name, "done" ], "updateSetting", "info");
            cb(null, {message: "ok"});
          });

        } catch (err) {
          hell.o(err, "updateSetting", "error");
          cb({name: "Error", status: 400, message: err.message});
        }

      })(); // async

  };

  settings.remoteMethod('updateSetting', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'value', type: 'boolean', required: true},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/updateSetting', verb: 'post', status: 200}
  });

  /**
   * LOAD SETTINGS TO VAR
   *
   * @param input
   * @param cb
   */
  settings.initialize = function (cb) {
    hell.o("start", "initialize", "info");

    (async () => {
      try {

        hell.o("query", "initialize", "info");
        let settings_result = await settings.findOne({id: "settingid"});
        if( ! settings_result ){
          await settings.create({id: "settingid"});
          settings_result = await settings.findOne({id: "settingid"});
        }
        settings_result.toJSON();

        let setts = Object.keys(settings_result);
        for (let i = 0, l = setts.length; i < l; i++) {
          if (setts[i] == "id") continue;
          hell.o([setts[i], settings_result[setts[i]]], "initialize", "info");
          settings[setts[i]] = settings_result[setts[i]];
        }

        hell.o("done", "initialize", "info");
        cb(null, true);

      } catch (err) {
        hell.o(err, "initialize", "err");
        cb(err);
      }

    })(); //async

  };

};
