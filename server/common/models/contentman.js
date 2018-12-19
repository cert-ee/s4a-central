'use strict';

const https = require('https');
const tar = require('tar');
const fs = require('fs');
const walk = require('walkdir');

const hell = new (require(__dirname + "/helper.js"))({module_name: "contentman"});

module.exports = function (contentman) {

  /**
   * INITIALIZE CONTENTMAN
   *
   * check paths?
   */
  contentman.initialize = async function () {
    hell.o("start", "initialize", "info");
    try {
      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "error");
      return false;
    }

  };

  /**
   * DOWNLOAD AND SAVE CONTENT
   *
   * src
   * dst
   *
   * @returns {Promise}
   */
  contentman.downloadContent = function (src, dst) {
    hell.o("start", "downloadContent", "info");
    return new Promise((success, reject) => {

      let file = fs.createWriteStream(dst);

      let request = https.get(src, function (response) {
        response.pipe(file);
        file.on('finish', function () {
          hell.o("done", "downloadContent", "info");
          file.close(success(true));
        });

      }).on('error', function (err) {
        hell.o(err, "downloadContent", "error");
        fs.unlink(input.local_path);
        reject(err);

      }); // https.get

    }); // promise

  };

  /**
   * EXTRACT CONTENT
   *
   * src
   * dst
   *
   * @returns {Promise}
   */
  contentman.extractContent = function (src, dst) {
    hell.o("start", "extractContent", "info");

    return new Promise((success, reject) => {
      hell.o(["tar file", src], "extractContent", "info");
      hell.o(["extract", dst], "extractContent", "info");

      tar.extract({
        file: src,
        cwd: dst,
        strip: 1
      }).then(_ => {
        hell.o("done", "extractContent", "info");
        success(true);
      }).catch(err => {
        hell.o(err, "extractContent", err);
        reject(err);
      }); // tar.extract

    }); // promise

  };

  /**
   * REMOVE FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  contentman.removeFilesR = async function (folder, ignore_file) {
    hell.o("start", "removeFilesR", "info");

    try {

      let files = await contentman.readDirR(folder);

      let stats, exists, counter = 0;

      if (files.length == 0) {
        throw new Error("no files to remove " + folder);
      }

      hell.o([files.length, " files found to remove"], "removeFilesR", "info");
      for (var i = 0; i < files.length; i++) {

        exists = await fs.existsSync(files[i]);
        if (!exists) {
          hell.o(["path does not exist:", files[i]], "removeFilesR", "error");
          continue;
        }

        stats = await fs.statSync(files[i]);

        if (process.env.NODE_ENV == "dev" && ignore_file !== undefined && files[i] == ignore_file) {
          hell.o(["DEV: ignore removing rules tar, so we would not abuse external sources", files[i]], "removeFilesR", "info");
          continue;
        }

        if (stats.isDirectory()) {
          hell.o(["ignore directory:", files[i]], "removeFilesR", "info");
        } else {
          //hell.o(["remove file:", files[i]], "removeFilesR", "info");
          await fs.unlinkSync(files[i]);
          counter++;
        }

      } // for loop

      hell.o([counter, " files removed"], "removeFilesR", "info");
      hell.o("done", "removeFilesR", "info");
      return true;

    } catch (err) {
      throw new Error(err);
    }

  };

  /**
   * GET FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  contentman.readDirR = async function (folder) {
    hell.o("start", "readDirR", "info");

    let list = await walk.sync(folder);
    //console.log(list);

    hell.o("done", "readDirR", "info");
    return list;

  };

  /**
   * CHECK PATH
   * create folders if missing
   *
   * @param path_to_check
   * @param create_file ( default true )
   */
  contentman.pathCheck = async function (path_to_check, create_file) {
    hell.o("start", "pathCheck", "info");
    try {

      if (create_file === undefined) create_file = true;

      let file_exists = await fs.existsSync(path_to_check);
      if (file_exists) {
        hell.o("done", "pathCheck", "info");
        return true;
      }
      if (!file_exists && !create_file) {
        throw new Error("not_found");
      }

      var splitted = path_to_check.split('/');
      splitted = splitted.filter(Boolean);

      var folders = splitted.slice(0, -1);
      var filename = splitted.slice(splitted.length, 1);

      let current_folder = "";
      for (const fd in folders) {

        current_folder = current_folder + "/" + folders[fd];
        let check_folder = await fs.existsSync(current_folder);

        hell.o(["check folder", current_folder], "pathCheck", "info");
        if (!check_folder) {
          let make_folder = await fs.mkdirSync(current_folder);
          hell.o(["make folder", current_folder], "pathCheck", "info");
        }
      }

      if (!file_exists) {
        hell.o(["make empty file", path_to_check], "pathCheck", "info");
        await fs.writeFileSync(path_to_check, "");
      }
      hell.o("done", "pathCheck", "info");
      return true;
    } catch (err) {
      hell.o(err, "pathCheck", "error");
      throw new Error(err);
    }
  };


};
