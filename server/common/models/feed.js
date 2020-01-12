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
        {
          name: "emerging_threats",
          friendly_name: "Emerging threats",
          enabled: true,
          primary: true,
          builtin: true,
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
          enabled: false,
          builtin: true,
          type: "url",
          location: "https://rules.emergingthreats.net/open/suricata-3.0/emerging.rules.tar.gz",
          filename: "emerging.rules.tar.gz",
          component_name: "suricata",
          component_type: "rules",
          description: "Emerging threats PRO rules"
        },
        {
          name: "yara_rules_local",
          friendly_name: "Yara rules local",
          enabled: true,
          builtin: true,
          type: "file",
          location: "/srv/s4a-central/moloch/yara/yara_rules_local/",
          filename: "yara_local.txt",
          component_name: "moloch",
          component_type: "yara",
          component_tag_name: "yara",
          description: "Yara rules local",
          checksum: "empty"
        },
        {
          name: "wise_ip_local",
          friendly_name: "Wise IPs local",
          enabled: true,
          builtin: true,
          type: "file",
          location: "/srv/s4a-central/moloch/wise_ip/wise_ip_local/",
          filename: "wise_ip_local.txt",
          component_name: "moloch",
          component_type: "wise_ip",
          component_tag_name: "wise_ip",
          description: "Wise IPs local",
          checksum: "empty"
        },
        {
          name: "wise_url_local",
          friendly_name: "Wise URLs local",
          enabled: true,
          builtin: true,
          type: "file",
          location: "/srv/s4a-central/moloch/wise_url/wise_url_local/",
          filename: "wise_url_local.txt",
          component_name: "moloch",
          component_type: "wise_url",
          component_tag_name: "wise_url",
          description: "Wise URLs local",
          checksum: "empty"
        },
        {
          name: "wise_domain_local",
          friendly_name: "Wise domains local",
          enabled: true,
          builtin: true,
          type: "file",
          location: "/srv/s4a-central/moloch/wise_domain/wise_domain_local/",
          filename: "wise_domain_local.txt",
          component_name: "moloch",
          component_type: "wise_domain",
          component_tag: "wise_domain",
          description: "Wise domains local",
          checksum: "empty"
        }
      ];
      // await feed.destroyAll();

      hell.o("check feeds", "initialize", "info");
      let create_result;
      for (const df of default_feeds) {
        hell.o(["check feed", df.name], "initialize", "info");
        create_result = await feed.findOrCreate({where: {name: df.name}}, df);
        if (!create_result) throw new Error("failed to create feed " + df.name);

        if (df.type == "file") {
          await feed.app.models.contentman.pathCheck(df.location + df.filename);
        }
      }

      /*
      add PRO tag to emerging_pro feed
       */
      let tag_exists = await feed.app.models.tag.findOne({where: {name: "PRO"}});
      if (!tag_exists) {
        let tag_create = await feed.app.models.tag.create({name: "PRO", description: "EM Pro rules"});
      }
      let pro_feed = await feed.findOne({where: {name: "emerging_pro"}, include: ["tags"]});
      // console.log(pro_feed.tags());
      let tag_found = await pro_feed.tags.exists(tag_exists);
      if (!tag_found && pro_feed) {
        hell.o("add PRO tag ro feed", "initialize", "info");
        await pro_feed.tags.add(tag_exists);
      }


      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "error");
      return false;
    }

  };


  /**
   * UPDATE FEED or CREATE
   *
   * @param name
   * @param enabled
   * @param options
   * @param cb
   */
  feed.change = function (entry, options, cb) {
    hell.o(["start " + entry.name, "enabled " + entry.enabled], "toggleAll", "info");
    hell.o("start", "change", "info");

    (async function () {
      try {

        let found_feed;

        if (entry.component_type == "rules" && entry.component_name != "suricata") {
          throw new Error("only suricata has rules");
        }
        if (entry.component_type == "wise" && entry.component_name != "moloch") {
          throw new Error("only moloch has wise");
        }
        if (entry.component_type == "yara" && entry.component_name != "moloch") {
          throw new Error("only moloch has yara");
        }

        found_feed = await feed.findOne({where: {name: entry.name}});

        if (!found_feed) {
          hell.o("create feed", "change", "info");
          await feed.create(entry);
        } else {
          hell.o("update feed", "change", "info");
          let update_input = entry;
          delete update_input.id;
          await feed.update({id: found_feed.id}, entry);
        }

        found_feed = await feed.findOne({where: {name: entry.name}});

        //check/create content folders
        await feed.contentPaths(found_feed);

        hell.o("check tasker", "change", "info");
        if (entry.enabled) {
          await feed.app.models.tasker.addFeedTasker(found_feed);
        } else {
          await feed.app.models.tasker.removeFeedTasker(found_feed);
        }

        hell.o("done", "change", "info");
        cb(null, {message: "ok", data: found_feed});
        return true;
      } catch (err) {
        hell.o(err, "change", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  feed.remoteMethod('change', {
    accepts: [
      {arg: 'entry', type: 'object', required: true},
      // {arg: 'enabled', type: 'boolean', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/change', verb: 'post', status: 201}
  });


  /**
   * TOGGLE FEEDS
   *
   * @param name
   * @param enabled
   * @param options
   * @param cb
   */
  feed.toggleEnable = function (feed_name, enabled, options, cb) {
    hell.o(["start " + feed_name, "enabled " + enabled], "toggleEnable", "info");

    (async function () {
      try {

        let found_feed = await feed.findOne({where: {name: feed_name}});
        if (!found_feed) throw new Error(feed_name + " could not find feed");

        let update_input = {enabled: enabled, last_modified: new Date()};
        let update_result = await feed.update({id: found_feed.id}, update_input);
        if (!update_result) throw new Error(feed_name + " could not update feed ");

        hell.o([feed_name, update_result], "toggleEnable", "info");
        found_feed = await feed.findOne({where: {name: feed_name}});

        hell.o("check tasker", "toggleEnable", "info");
        if (enabled) {
          await feed.app.models.tasker.addFeedTasker(found_feed);
        } else {
          await feed.app.models.tasker.removeFeedTasker(found_feed);
        }

        hell.o([feed_name, "done"], "toggleEnable", "info");

        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "toggleEnable", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  feed.remoteMethod('toggleEnable', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'enabled', type: 'boolean', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/toggleEnable', verb: 'post', status: 201}
  });


  /**
   * TOGGLE TAG FOR ALL RULES FOR A FEED
   *
   * @param feed_name
   * @param name
   * @param enabled
   * @param options
   * @param cb
   */
  feed.tagAll = function (feed_name, tag_id, enabled, options, cb) {
    hell.o("start", "tagAll", "info");
    hell.o([feed_name + " start", feed_name + " " + " tag: " + tag_id + " enabled: " + enabled], "tagAll", "info");

    (async function () {
      try {

        const rule = feed.app.models.rule;
        const tag = feed.app.models.tag;

        hell.o([feed_name, "find feed"], "tagAll", "info");
        let fd = await feed.findOne({where: {name: feed_name}, include: ["tags"]});
        if (!fd) throw new Error(feed_name + " could not find feed");

        // if (fd.component_name != "suricata") {
        //   throw new Error("only suricata rules can be tagged right now");
        // }
        if (fd.primary) {
          throw new Error("Sorry, can not tag primary rules, +25k tags...");
        }

        hell.o([feed_name, "find tag"], "tagAll", "info");
        let tag_exists = await tag.findById(tag_id);
        if (!tag_exists) throw new Error(feed_name + " could not find tag: " + tag_id);

        if (enabled) {
          hell.o([feed_name, "add tag to feed"], "tagAll", "info");
          hell.o([feed_name, tag_exists.name], "tagAll", "info");
          let feed_tag = await fd.tags.add(tag_exists);
          let rules = await rule.find({where: {feed_name: feed_name}});

          for (let i = 0, l = rules.length; i < l; i++) {
            rules[i].tags.add(tag_exists);
          }
        }

        if (!enabled) {
          hell.o([feed_name, "remove tag from feed"], "tagAll", "info");
          hell.o([feed_name, tag_exists.name], "tagAll", "info");
          let feed_tag = await fd.tags.remove(tag_exists);
          let rules = await rule.find({where: {feed_name: feed_name}});

          for (let i = 0, l = rules.length; i < l; i++) {
            rules[i].tags.remove(tag_exists);
          }
        }

        hell.o([feed_name, "done"], "tagAll", "info");

        let output = await feed.findOne({where: {name: feed_name}, include: ["tags"]});
        cb(null, {message: "ok", data: output});

      } catch (err) {
        hell.o(err, "tagAll", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  feed.remoteMethod('tagAll', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'tag', type: 'string', required: true},
      {arg: 'enabled', type: 'boolean', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/tagAll', verb: 'post', status: 201}
  });

  /**
   * GET FOLDERS / CONTENT PATHS
   *
   * create if missing
   *
   * @param input ( feed )
   * @returns {Promise<*>}
   */
  feed.contentPaths = async function (input) {
    hell.o([input.name, "start"], "contentPaths", "info");

    try {

      let settings = await feed.app.models.settings.findOne();
      let content_path = settings["path_" + input.component_name + "_content"];

      let output = {
        folder: content_path + input.component_type + "/" + input.name + "/",
        local_path: content_path + input.component_type + "/" + input.name + "/" + input.filename,
        url: input.location_url
      };

      hell.o([input.name, "check folders"], "contentPaths", "info");
      await feed.app.models.contentman.pathCheck(output.local_path);

      let checksum_file = util.promisify(checksum.file);
      let cs = await checksum_file(output.local_path);

      if (input.checksum != cs) {
        hell.o([input.name, "checksum has changed, update"], "contentPaths", "info");
        await feed.update({name: input.name}, {"checksum": cs});
      }

      if (input.location_folder != output.folder) {
        hell.o([input.name, "location has changed, update"], "contentPaths", "info");
        await feed.update({name: input.name}, {"location_folder": output.folder});
      }


      hell.o([input.name, "done"], "contentPaths", "info");
      return output;
    } catch (err) {
      hell.o([input.name, "failed"], "contentPaths", "error");
      hell.o(err, "contentPaths", "error");
      return false;
    }

  };

  /**
   * RUN TASK
   *
   * input:
   * name
   * component_name
   *
   * @type {{}}
   */
  feed.tasks = {};
  feed.task = async function (input, cb) {
    hell.o([input.feed_name, "start"], "task", "info");
    // console.log(input);

    if (!feed.tasks.hasOwnProperty(input.component_name)) {
      feed.tasks[input.component_name] = false;
    }

    if (feed.tasks[input.component_name] == true) {
      hell.o(["feed check in progress for", input.component_name], "task", "warn");
      if (cb) return cb({name: "Error", status: 400, message: "worker_busy", worker_busy: true});
      return;
    }

    // const PATH_BASE = process.env.PATH_BASE;

    try {

      feed.tasks[input.component_name] = true;

      let entry = await feed.findOne({where: {name: input.feed_name}, include: ["tags"]});
      if (!entry) throw new Error("failed to load feed: " + input.feed_name);

      console.log(entry);

      //check/create content folders
      let content_params = await feed.contentPaths(entry);

      switch (entry.type) {
        /**
         * URLS
         */
        case "url":
          // console.log("feed url ----------------------------");

          let downloaded_size = 0;
          let downloaded = await fs.existsSync(content_params.local_path);

          if (downloaded) {
            let downloaded_stats = await fs.statSync(content_params.local_path);
            downloaded_size = downloaded_stats.size;
          }

          console.log("size", downloaded_size);
          //console.log( "downloaded", downloaded );
          // if( entry.name == "emerging_threats2" ){ downloaded = false; }

          // while testing do not download always
          //|| entry.component_type !== "moloch"
          if (process.env.NODE_ENV != "dev" || !downloaded || downloaded_size < 10) {
            hell.o([entry.name, "no file, download"], "task", "info");
            // console.log( content_params )
            let rules_tar_path = await feed.app.models.contentman.downloadContent(content_params.url, content_params.local_path);
          } else {
            hell.o([entry.name, "DEV, do not redownload rules"], "task", "info");
          }

          if (entry.component_name == "suricata") {
            hell.o([entry.name, "extract"], "task", "info");
            let extracted = await feed.app.models.contentman.extractContent(content_params.local_path, content_params.folder);

            hell.o([entry.name, "scan dir for rule files"], "task", "info");
            let extracted_files = await feed.app.models.contentman.readDirR(content_params.folder);
            hell.o([entry.name, "loop files"], "task", "info");
            // console.log( extracted_files );
            let filtered_files = await feed.app.models.rule.loopRuleFiles(extracted_files, entry);
            hell.o([entry.name, "remove files"], "task", "info");
            let remove_files = await feed.app.models.contentman.removeFilesR(content_params.folder, content_params.local_path);
          }

          if (entry.component_name == "moloch") {

            // let extracted_files = await feed.app.models.contentman.readDirR(content_params.folder);
            // console.log( extracted_files );

            let checksum_file = util.promisify(checksum.file);
            let cs = await checksum_file(content_params.local_path);
            if (cs !== entry.checksum) {
              hell.o([entry.name, "checksum has changed"], "task", "info");
              await feed.update({name: entry.name}, {"checksum": cs, "location_folder": content_params.folder});
            }

          }

          break;
        /**
         * FILES
         */
        case "file":

          /*
          AFTER LATEST CHANGE REQUEST, NOTHING MUCH TO DO WITH THIS PART OF THE TASK
           */
          let checksum_file = util.promisify(checksum.file);
          let cs = await checksum_file(content_params.local_path);
          if (cs !== entry.checksum) {
            hell.o([entry.name, "checksum has changed"], "task", "info");
            await feed.update({name: entry.name}, {"checksum": cs, "location_folder": content_params.folder});
          }

          break;

        default:
          throw new Error("failed to match feed type " + entry.type);
      }

      hell.o([entry.name, "done"], "task", "info");
      feed.tasks[entry.component_name] = false;

      if (cb) return cb(null, {message: "ok"});
      return true;

    } catch (err) {
      hell.o([input.feed_name, "failed"], "task", "error");
      hell.o(err, "task", "error");
      feed.tasks[input.feed_name] = false;

      if (cb) return cb({name: "name", status: 400, message: err.message});
      return false;
    }

  }; //feed.task


};
