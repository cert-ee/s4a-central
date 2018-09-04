'use strict';

const https = require('https');
const tar = require('tar');
const fs = require('fs');
const util = require('util');
const walk = require('walkdir');
const checksum = require('checksum');

const LineByLineReader = require('line-by-line');
const hell = new (require(__dirname + "/helper.js"))({module_name: "feed"});

module.exports = function (feed) {

  /**
   * INITIALIZE FEEDS
   *
   * create defaults
   */
  feed.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {
      let default_feeds = [

        //TODO: feeds turned off for testing
        /*{
          name: "emerging_threats",
          friendly_name: "Emerging threats",
          enabled: true,
          primary: true,
          type: "url",
          location: "https://rules.emergingthreats.net/open/suricata-3.0/emerging.rules.tar.gz",
          filename: "emerging.rules.tar.gz",
          component_name: "suricata",
          component_type: "rules",
          description: "Emerging threats community rules"
        },
        {
          name: "emerging_pro",
          friendly_name: "Emerging threats PRO",
          enabled: true,
          type: "url",
          location: "https://rules.emergingthreats.net/open/suricata-3.0/emerging.rules.tar.gz",
          filename: "emerging.rules.tar.gz",
          component_name: "suricata",
          component_type: "rules",
          description: "Emerging threats community rules PRO"
        },
        */
        {
          name: "yara_rules_local",
          friendly_name: "Yara rules local",
          enabled: false,
          type: "file",
          location: "/srv/s4a-central/moloch/yara_rules_local/",
          filename: "yara_local.txt",
          component_name: "moloch",
          component_type: "yara",
          description: "Yara rules local",
          checksum: "empty"
        },
        {
          name: "wise_ip_local",
          friendly_name: "Wise IPs local",
          enabled: true,
          type: "file",
          location: "/srv/s4a-central/moloch/wise_ip_local/",
          filename: "wise_ip_local.txt",
          component_name: "moloch",
          component_type: "wise_ip",
          description: "Wise IPs local",
          checksum: "empty"
        },
        {
          name: "wise_url_local",
          friendly_name: "Wise URLs local",
          enabled: true,
          type: "file",
          location: "/srv/s4a-central/moloch/wise_url_local/",
          filename: "wise_url_local.txt",
          component_name: "moloch",
          component_type: "wise_url",
          description: "Wise URLs local",
          checksum: "empty"
        },
        {
          name: "wise_domain_local",
          friendly_name: "Wise domains local",
          enabled: true,
          type: "file",
          location: "/srv/s4a-central/moloch/wise_domain_local/",
          filename: "wise_domain_local.txt",
          component_name: "moloch",
          component_type: "wise_domain",
          description: "Wise domains local",
          checksum: "empty"
        }
      ];
      // await feed.destroyAll();


      //TODO: TESTING TIME IS FOR TESTING
      // const tag = feed.app.models.tag;
      // let tag_exists = await tag.findOne({ where: { name: "PRO"} });
      // console.log( tag_exists );
      // if (!tag_exists) throw new Error(ruleset_name + " could not find tag" );

      // let pro_feed = await feed.findOne({where: {name: "emerging_pro"}, include: ["tags"]});
      // console.log( pro_feed );
      // console.log( pro_feed.tags() );
      // let tag_found = await pro_feed.tags.exists( tag_exists );
      // console.log( [ "tag_found: ", tag_found] );
      // if( !tag_found ){
      //   console.log( "add tag PRO for pro feed");
      //   await pro_feed.tags.add( tag_exists );
      // }



      hell.o("check feeds", "initialize", "info");
      let create_result;
      for (const df of default_feeds) {
        hell.o(["check feed", df.name], "initialize", "info");
        create_result = await feed.findOrCreate({where: {name: df.name}}, df);
        if (!create_result) throw new Error("failed to create feed " + df.name);
      }
      return true;
    } catch (err) {
      hell.o(err, "initialize", "error");
      return false;
    }

  };

  /**
   * DOWNLOAD AND SAVE CONTENT
   *
   * @returns {Promise}
   */
  feed.downloadContent = function (input) {
    hell.o("start", "downloadContent", "info");
    console.log(input)
    return new Promise((success, reject) => {

      let file = fs.createWriteStream(input.local_path);

      let request = https.get(input.url, function (response) {
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
   * @returns {Promise}
   */
  feed.extractContent = function (input) {
    hell.o("start", "extractContent", "info");

    return new Promise((success, reject) => {
      hell.o(["tar file", input.local_path], "extractContent", "info");
      hell.o(["extract", input.folder], "extractContent", "info");

      tar.extract({
        file: input.local_path,
        cwd: input.folder,
        strip: 1
      }).then(_ => {
        hell.o("done", "extractContent", "info");
        success(true);
      }).catch(err => {
        hell.o(err, "extractContent", err);
        reject(err);
        // console.log(err);
      }); // tar.extract

    }); // promise

  };

  /**
   * REMOVE FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  feed.removeFilesR = async function (input) {
    hell.o("start", "removeFilesR", "info");

    try {

      let files = await feed.readDirR(input);

      let stats, exists, counter = 0;

      if (files.length == 0) {
        throw new Error("no files to remove " + input.folder);
      }

      hell.o([files.length, " files found to remove"], "removeFilesR", "info");
      for (var i = 0; i < files.length; i++) {

        exists = await fs.existsSync(files[i]);
        if (!exists) {
          hell.o(["path does not exist:", files[i]], "removeFilesR", "error");
          continue;
        }

        stats = await fs.statSync(files[i]);

        if (process.env.NODE_ENV == "dev" && files[i] == input.local_path) {
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
  feed.readDirR = async function (input) {
    hell.o("start", "readDirR", "info");

    let list = await walk.sync(input.folder);
    //console.log(list);

    hell.o("done", "readDirR", "info");
    return list;

  };

  /**
   * CHECK PATH
   * create folders if missing
   *
   * @param base_path
   * @param feed_name
   * @param feed_file
   */
  feed.pathCheck = async function (base_path, feed_name, feed_file) {
    hell.o("start", "pathCheck", "info");
    try {
      // console.log(base_path, feed_name);

      let folders = [
        base_path,
        base_path + feed_name
      ];

      for (const fd in folders) {
        let check_folder = await fs.existsSync(folders[fd]);
        hell.o(["check folder", folders[fd]], "pathCheck", "info");
        if (!check_folder) {
          let make_folder = await fs.mkdirSync(folders[fd]);
          hell.o(["make folder", folders[fd]], "pathCheck", "info");
        }
      }

      let file_exists = await fs.existsSync(base_path + feed_name + '/' + feed_file);
      if (!file_exists) {
        hell.o(["make empty file", base_path + feed_name + '/' + feed_file], "pathCheck", "info");
        await fs.writeFileSync(base_path + feed_name + '/' + feed_file, "");
      }

    } catch (err) {
      hell.o(err, "pathCheck", "error");
      throw new Error(err);
    }
  };

  feed.tasks = {};
  feed.task = async function (input, cb) {
    hell.o([input.feed_name, "start"], "task", "info");
    //console.log(input);

    if (!feed.tasks.hasOwnProperty(input.feed_name)) {
      feed.tasks[input.feed_name] = false;
    }

    if (feed.tasks[input.feed_name] == true) {
      hell.o("feed check in progress", "task", "warn");
      if (cb) return cb({name: "Error", status: 400, message: "worker_busy"});
      return;
    }

    // const PATH_BASE = process.env.PATH_BASE;

    try {

      feed.tasks[input.feed_name] = true;

      let entry = await feed.findOne({where: {name: input.feed_name}, include: ["tags"]});
      if (!entry) throw new Error("failed to load feed: " + input.feed_name);

      let content_path = await feed.app.models.settings.findOne({where: {name: "path_" + entry.component_name + "_content"}});

      await feed.pathCheck(content_path.data, entry.name, entry.filename);

      let content_params = {
        folder: content_path.data + entry.name,
        local_path: content_path.data + entry.name + "/" + entry.filename,
        url: entry.location
      };
      // console.log(content_params);

      switch (entry.type) {
        /**
         * URLS
         */
        case "url":
          // console.log("feed url ----------------------------");

          let downloaded = await fs.existsSync(content_params.local_path);

          // if( entry.name == "emerging_threats2" ){ downloaded = false; }

          // while testing do not download always
          if (process.env.NODE_ENV != "dev" || !downloaded) {
            hell.o([input.feed_name, "no tar file, download"], "task", "info");
            let rules_tar_path = await feed.downloadContent(content_params);
          } else {
            hell.o([input.feed_name, "DEV, do not redownload rules"], "task", "info");
          }

          hell.o([input.feed_name, "extract"], "task", "info");
          let extracted = await feed.extractContent(content_params);
          hell.o([input.feed_name, "scan dir for rule files"], "task", "info");
          let extracted_files = await feed.readDirR(content_params);
          hell.o([input.feed_name, "loop files"], "task", "info");

          if (entry.component_name == "suricata") {
            let filtered_files = await feed.app.models.rule.loopRuleFiles(extracted_files, entry);
          } else {
            //if moloch download content...
          }

          //
          hell.o([input.feed_name, "remove files"], "task", "info");
          // let remove_files = await feed.removeFilesR(content_params);

          hell.o([input.feed_name, "done"], "task", "info");


          break;
        /**
         * FILES
         */
        case "file":
          // console.log("feed file ----------------------------");

          let file_exists = await fs.existsSync(content_params.local_path);
          if (!file_exists) {
            throw new Error("file foes not exist: " + content_params.local_path);
          }

          let checksum_file = util.promisify(checksum.file);
          let cs = await checksum_file(content_params.local_path);

          if (entry.checksum != cs) {

            hell.o([input.feed_name, "checksum has changed"], "task", "warn");

            switch (entry.component_type) {

              case "yara":
                await feed.app.models.yara.generateNewOutput();
                break;

              case "wise_ip":
              case "wise_url":
              case "wise_domain":
                await feed.app.models.wise.generateNewOutput();
                break;

              default:
                throw new Error("failed to match feed component_type " + entry.type);
            }

            await feed.update({name: entry.name}, {"checksum": cs});
          }
          break;

        default:
          throw new Error("failed to match feed type " + entry.type);
      }

      feed.tasks[input.feed_name] = false;

      cb(null, {message: "ok"});

    } catch (err) {
      hell.o([input.feed_name, "failed"], "task", "error");
      hell.o(err, "task", "error");
      feed.tasks[input.feed_name] = false;

      cb({name: "name", status: 400, message: err.message});
    }

  }; //feed.task


};