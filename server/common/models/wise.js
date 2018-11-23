'use strict';
const fs = require("fs");
const util = require('util');
const checksum = require('checksum');
const hell = new (require(__dirname + "/helper.js"))({module_name: "wise"});

module.exports = function (wise) {

  /**
   * INITIALIZE wise
   *
   * create defaults
   */
  wise.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      let default_wise = [
        {
          name: "checksum",
          friendly_name: "Checksum",
          description: "Wise checksum",
          data: "empty"
        },
        {
          name: "busy",
          friendly_name: "Busy",
          description: "Importing in progress, wait",
          data: false
        }
      ];
      // await wise.destroyAll();

      hell.o("check default_wise", "initialize", "info");
      let create_result;
      for (const dw of default_wise) {
        hell.o(["check setting", dw.name], "initialize", "info");
        create_result = await wise.findOrCreate({where: {name: dw.name}}, dw);
        if (!create_result) throw new Error("failed to create wise " + dw.name);

      }

      hell.o("done", "initialize", "info");

      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };

  /**
   * GENERATE NEW EXPORT FILE
   *
   */
  wise.generateNewOutput = async function () {
    hell.o("start", "generateNewOutput", "info");
    try {

      await wise.update({name: "busy"}, {data: true});

      let path_out, cs, total_checksum = "";
      let checksum_file = util.promisify(checksum.file);

      for (const wise_type of ["wise_ip", "wise_url", "wise_domain"]) {
        path_out = await wise.app.models.settings.findOne({where: {name: "path_moloch_" + wise_type + "_out"}});

        let wises = await wise.app.models.feed.find({
          where: {
            component_name: "moloch",
            component_type: wise_type,
            enabled: true
          }
        });

        let wise_contents = "", file_contents, file_path;
        for (let i = 0, l = wises.length; i < l; i++) {
          file_path = wises[i].location + wises[i].filename;
          file_contents = await fs.readFileSync(file_path, 'utf8');
          wise_contents = wise_contents + file_contents;
        }

        await fs.writeFileSync(path_out.data, wise_contents);
        cs = await checksum_file(path_out.data);

        total_checksum = total_checksum + cs;
      }

      await wise.update({name: "checksum"}, {data: total_checksum});
      await wise.update({name: "busy"}, {data: false});

      hell.o("done", "generateNewOutput", "info");
      return true;

    } catch (err) {
      await wise.update({name: "busy"}, {data: false});
      hell.o(err, "generateNewOutput", "err");
      return false;
    }

  };

  /**
   * CHECK DETECTOR CS AGAINST CENTRAL
   *
   * return new wise if not matched
   */
  wise.checkForDetector = async function (detector_checksum) {
    hell.o("start", "checkForDetector", "info");
    try {

      let path_moloch_wise_ip_out = await wise.app.models.settings.findOne({where: {name: "path_moloch_wise_ip_out"}});
      let path_moloch_wise_url_out = await wise.app.models.settings.findOne({where: {name: "path_moloch_wise_url_out"}});
      let path_moloch_wise_domain_out = await wise.app.models.settings.findOne({where: {name: "path_moloch_wise_domain_out"}});

      let wise_checksum = await wise.findOne({where: {name: "checksum"}});
      // we do not need 3 really, at the moment
      // let wise_ip_checksum = await wise.findOne({where: {name: "wise_ip_checksum"}});
      // let wise_url_checksum = await wise.findOne({where: {name: "wise_url_checksum"}});
      // let wise_domain_checksum = await wise.findOne({where: {name: "wise_domain_checksum"}});

      let output = {
        checksum: wise_checksum.data,
        wise_ip: "",
        wise_url: "",
        wise_domain: ""
      };

      if (detector_checksum !== wise_checksum.data) {
        hell.o("detector checksum different, return wise", "checkForDetector", "info");
        output.wise_ip = await fs.readFileSync(path_moloch_wise_ip_out.data, 'utf8');
        output.wise_url = await fs.readFileSync(path_moloch_wise_url_out.data, 'utf8');
        output.wise_domain = await fs.readFileSync(path_moloch_wise_domain_out.data, 'utf8');
      }

      hell.o("done", "checkForDetector", "info");
      return output;

    } catch (err) {
      hell.o(err, "checkForDetector", "err");
      return false;
    }

  };

};
