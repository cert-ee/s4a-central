'use strict';
const fs = require("fs");
const util = require('util');
const checksum = require('checksum');
const hell = new (require(__dirname + "/helper.js"))({module_name: "yara"});

module.exports = function (yara) {

  /**
   * INITIALIZE YARA
   *
   * create defaults
   */
  yara.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      let default_yara = [
        {
          name: "checksum",
          friendly_name: "Checksum",
          description: "Yara rules checksum",
          data: "empty"
        },
        {
          name: "busy",
          friendly_name: "Busy",
          description: "Importing in progress, wait",
          data: false
        }
      ];
      // await yara.destroyAll();

      hell.o("check default_yara", "initialize", "info");
      let create_result;
      for (const dy of default_yara) {
        hell.o(["check setting", dy.name], "initialize", "info");
        create_result = await yara.findOrCreate({where: {name: dy.name}}, dy);
        if (!create_result) throw new Error("failed to create yara " + dy.name);

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
  yara.generateNewOutput = async function () {
    hell.o("start", "generateNewOutput", "info");
    try {

      let path_moloch_yara_out = await yara.app.models.settings.findOne({where: {name: "path_moloch_yara_out"}});

      let yaras = await yara.app.models.feed.find({
        where: {
          component_name: "moloch",
          component_type: "yara",
          enabled: true
        }
      });
      let yara_contents = "", file_contents, file_path;
      for (let i = 0, l = yaras.length; i < l; i++) {
        file_path = yaras[i].location + yaras[i].filename;

        file_contents = await fs.readFileSync(file_path, 'utf8');
        yara_contents = yara_contents + file_contents;
      }

      await yara.update({name: "busy"}, {data: true});

      await fs.writeFileSync(path_moloch_yara_out.data, yara_contents);

      let checksum_file = util.promisify(checksum.file);
      let cs = await checksum_file(path_moloch_yara_out.data);
      await yara.update({name: "checksum"}, {data: cs});

      await yara.update({name: "busy"}, {data: false});

      hell.o("done", "generateNewOutput", "info");
      return true;

    } catch (err) {
      await yara.update({name: "busy"}, {data: false});
      hell.o(err, "generateNewOutput", "err");
      return false;
    }

  };

  /**
   * CHECK DETECTOR CS AGAINST CENTRAL
   *
   * return new yara if not matched
   */
  yara.checkForDetector = async function (detector_checksum) {
    hell.o("start", "checkForDetector", "info");
    try {

      let path_moloch_yara_out = await yara.app.models.settings.findOne({where: {name: "path_moloch_yara_out"}});

      let yara_checksum = await yara.findOne({where: {name: "checksum"}});

      let output = {
        checksum: yara_checksum.data,
        yara: ""
      };

      if (detector_checksum !== yara_checksum.data) {
        hell.o("detector checksum different, return yara", "checkForDetector", "info");
        output.yara = await fs.readFileSync(path_moloch_yara_out.data, 'utf8');
      }

      hell.o("done", "checkForDetector", "info");
      return output;

    } catch (err) {
      hell.o(err, "checkForDetector", "err");
      return false;
    }

  };

};
