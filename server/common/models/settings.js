'use strict';
const fs = require('fs');
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

      const PATH_BASE = process.env.PATH_BASE;

      //TODO checks for
      if (!PATH_BASE) throw new Error("env missing: PATH_BASE");

      let exists = await fs.existsSync(PATH_BASE);
      if (!exists) {
        throw new Error("path does not exist:" + PATH_BASE);
      }

      let default_settings = [
        {
          name: "path_content_base",
          friendly_name: "Base path for content folders",
          description: "Base path for content folders",
          data: PATH_BASE,
          locked: true
        },
        {
          name: "path_suricata_content",
          friendly_name: "Base path for suricata content folders",
          description: "Base path for suricata content folders",
          data: PATH_BASE + "suricata/",
          locked: true
        },
        {
          name: "path_moloch_content",
          friendly_name: "Base path for moloch content folders",
          description: "Base path for moloch content folders",
          data: PATH_BASE + "moloch/",
          locked: true
        },
        {
          name: "path_moloch_yara_out",
          friendly_name: "Path yara rules out ",
          description: "Path to yara rules for detectors",
          data: PATH_BASE + "moloch/SYSTEM_moloch_yara_out.txt",
          locked: true
        },
        {
          name: "path_moloch_wise_ip_out",
          friendly_name: "Path wise IPs out ",
          description: "Path to wise IPs for detectors",
          data: PATH_BASE + "moloch/SYSTEM_moloch_wise_ip_out.txt",
          locked: true
        },
        {
          name: "path_moloch_wise_url_out",
          friendly_name: "Path wise URLs out ",
          description: "Path to wise URLs for detectors",
          data: PATH_BASE + "moloch/SYSTEM_moloch_wise_url_out.txt",
          locked: true
        },
        {
          name: "path_moloch_wise_domain_out",
          friendly_name: "Path wise domains out ",
          description: "Path to wise domains for detectors",
          data: PATH_BASE + "moloch/SYSTEM_moloch_wise_domain_out.txt",
          locked: true
        }
      ];
      // await settings.destroyAll();

      hell.o("check settings", "initialize", "info");
      let create_result;
      for (const ds of default_settings) {
        hell.o(["check setting", ds.name], "initialize", "info");
        create_result = await settings.findOrCreate({where: {name: ds.name}}, ds);
        if (!create_result) throw new Error("failed to create setting " + ds.name);
      }

      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };

};
