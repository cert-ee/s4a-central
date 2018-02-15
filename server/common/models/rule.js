'use strict';

const https = require('https');
const tar = require('tar');
const fs = require('fs');
const walk = require('walkdir');

const LineByLineReader = require('line-by-line')
const hell = new (require(__dirname + "/helper.js"))({module_name: "rule"});

module.exports = function (rule) {

  const PATH_SURICATA_EM_TEMP = process.env.PATH_SURICATA_EM_TEMP; // "/srv/data/suricata_em/temp.tar.gz",
  const PATH_SURICATA_EM_TEMP_EXTRACT = process.env.PATH_SURICATA_EM_TEMP_EXTRACT; // "/srv/data/suricata_em/",
  const PATH_SURICATA_EM_RULES = process.env.PATH_SURICATA_EM_RULES; // "/srv/data/suricata_em/rules/";
  const URL_SURICATA_EM_RULES = process.env.URL_SURICATA_EM_RULES; //"https://rules.emergingthreats.net/open/suricata-3.0/emerging.rules.tar.gz";
  //'wget -qO - https://rules.emergingthreats.net/open/suricata-3.0/emerging.rules.tar.gz | tar -x -z -C "/etc/suricata" -f -';

  /**
   * Download and save ET rules file
   *
   * @param input
   * @returns {Promise}
   */
  rule.getEmergingThreatRulesFile = function (input) {
    hell.o("start", "getEmergingThreatRulesFile", "info");

    return new Promise((success, reject) => {

      let file = fs.createWriteStream(PATH_SURICATA_EM_TEMP);

      let request = https.get(URL_SURICATA_EM_RULES, function (response) {
        response.pipe(file);
        file.on('finish', function () {
          hell.o("done", "getEmergingThreatRulesFile", "info");
          file.close(success(true));
        });

      }).on('error', function (err) {
        hell.o(err, "getEmergingThreatRulesFile", "error");
        fs.unlink(PATH_SURICATA_EM_TEMP);
        reject(err);

      }); // http.get

    }); // promise

  };

  /**
   * Extract the rules file
   *
   * @returns {Promise}
   */
  rule.extractEmergingThreatRulesFile = function () {
    hell.o("start", "extractEmergingThreatRulesFile", "info");

    return new Promise((success, reject) => {
      hell.o(["tar file", PATH_SURICATA_EM_TEMP], "extractEmergingThreatRulesFile", "info");
      hell.o(["extract", PATH_SURICATA_EM_TEMP_EXTRACT], "extractEmergingThreatRulesFile", "info");

      tar.extract({
        file: PATH_SURICATA_EM_TEMP,
        cwd: PATH_SURICATA_EM_TEMP_EXTRACT
      }).then(_ => {
        hell.o("done", "extractEmergingThreatRulesFile", "info");
        success(true);
      }).catch(err => {
        hell.o(err, "extractEmergingThreatRulesFile", err);
        console.log(err);
      }); // tar.extract

    }); // promise

  };

  /**
   * REMOVE FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  rule.removeFilesR = function (dir) {
    hell.o("start", "removeFilesR", "info");

    return new Promise(function (success, reject) {

      (async function () {

        let files = await rule.readDirR(dir);

        let stats, counter=0;
        if (files.length > 0){
          hell.o([ files.length, " files found to remove"], "removeFilesR", "info");
          for (var i = 0; i < files.length; i++) {

            if (fs.existsSync(files[i])){
              stats = fs.statSync(files[i]);

              if( process.env.NODE_ENV == "dev" && files[i] == PATH_SURICATA_EM_TEMP ){
                hell.o([ "ignore rules tar, so we would not abuse ET", files[i] ], "removeFilesR", "info");
                continue;
              }

              if( stats.isDirectory() ){
                hell.o([ "ignore directory:", files[i] ], "removeFilesR", "info");
              } else {
                hell.o([ "remove file:", files[i] ], "removeFilesR", "info");
                fs.unlinkSync(files[i]);
                counter++;
              }

            } else {
              hell.o([ "path does not exist:", files[i] ], "removeFilesR", "error");
            }

          } // for loop

          hell.o([ counter, " files removed"], "removeFilesR", "info");
        }

        hell.o("done", "removeFilesR", "info");
        success(true);

      })(); // async

    }); // promise

  };

  /**
   * GET FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  rule.readDirR = function (dir) {
    hell.o("start", "readDirR", "info");

    return new Promise(function (success, reject) {

      let list = walk.sync( dir );
      console.log( list );

      if( list.length > 0 ) {
        hell.o("done", "readDirR", "info");
        success(list);
      } else {
        hell.o("no rule files found", "readDirR", "error");
        reject("no files found");
      }

    }); // promise

  };

  /**
   * LOOP RULE FILES
   *
   * @param rule_files
   * @returns {Promise}
   */
  rule.loopRuleFiles = function (rule_files) {
    hell.o("start", "loopRuleFiles", "info");

    const Ruleset = rule.app.models.ruleset;

    return new Promise(function (success, reject) {

      (async function () {

        let file_check, ruleset_check, ruleset_name, ruleset_insert, filename;
        for (let file_full_path of rule_files) {

          filename = file_full_path.split("/").pop();

          if ( !filename.includes(".rules") ) {
            hell.o([filename, " not rules file - ignore"], "loopRuleFiles", "info");
            continue;
          }

          hell.o([filename, "loop"], "loopRuleFiles", "info");

          if (!/\.rules$/.test(filename)) continue; // ignore not .rules files

          //import only a subset of all the rules while development / testing
          if (process.env.NODE_ENV == "dev") {
            if (
              !filename.includes("pop3") && !filename.includes("shellcode") &&
              !filename.includes("telnet") && !filename.includes("chat") &&
              !filename.includes("drop") && !filename.includes("ftp")
            ) {
              hell.o([filename, " dev mode - ignore"], "loopRuleFiles", "info");
              continue;
            } // for testing
          }

          hell.o([filename, "loop"], "loopRuleFiles", "info");

          ruleset_name = filename.replace("emerging-", "");
          ruleset_name = ruleset_name.replace(".rules", "");
          ruleset_insert = {name: ruleset_name};

          /*
          IF NEW RULESET, CREATE
           */
          hell.o([ruleset_name, "find"], "loopRuleFiles", "info");
          ruleset_check = await Ruleset.findOrCreate({where: ruleset_insert, include: ["tags"]}, ruleset_insert);
          if (!ruleset_check) throw new Error("failed to find / create ruleset");
          ruleset_check = ruleset_check[0];
          //hell.o("done", "checkNewRulesForDetector", "info");

          /*
          CHECK RULE FILE
           */
          hell.o([ruleset_name, "check file"], "loopRuleFiles", "info");
          file_check = await rule.checkRuleFile({path: file_full_path, ruleset: ruleset_check}).then(value => {
            return value;
          }).catch(err => {
            hell.o([ruleset_name, "check file result"], "loopRuleFiles", "error");
            reject( err );
          });

          hell.o([ruleset_name, "loop done for " + file_check], "loopRuleFiles", "info");
          hell.o(["==================================="], "loopRuleFiles", "info");

        };

        hell.o("done", "loopRuleFiles", "info");
        hell.o("===================================", "loopRuleFiles", "info");
        success( true );

      })(); //async

    }); //promise

  };

  /**
   * CHECK RULE FILE
   * line by line
   *
   * @param params
   * @returns {Promise}
   */
  rule.checkRuleFile = function (params) {
    hell.o("start", "checkRuleFile", "info");

    return new Promise(function (success, reject) {

      let lineno = 0;
      let lr = new LineByLineReader(params.path);

      lr.on('error', function (err) {
        hell.o(err, "checkRuleFile", "error");
        reject(err);
      });

      lr.on('line', function (line) {
        lineno++;

        lr.pause();

        /*
        CHECK ONE RULE
         */
        rule.checkRuleLine({ruleset: params.ruleset, line: line}).then(value => {
          lr.resume();
        }).catch(err => {
          hell.o(err, "checkRuleFile", "error");
          reject("error");
        });

      }); // lr.on

      lr.on('end', function () {
        hell.o("done", "checkNewRulesForDetector", "info");
        success(lineno);
      });

    }); // promise

  };

  /**
   * CHECK RULE LINE FROM FILE
   *
   * @param params
   * @returns {Promise}
   */
  rule.checkRuleLine = function (params) {
    //hell.o( "start" , "checkRuleLine", "info" );
    return new Promise(function (success, reject) {

      let line = params.line;

      //not a rule line, comments etc
      if (!( (line).startsWith("#alert") || (line).startsWith("alert") )) return success(true); // console.log( line );

      let sid = parseInt(line.match(/sid:([0-9]*);/)[1]);
      // hell.o([sid, "start"], "checkRuleLine", "info");
      let revision = parseInt(line.match(/rev:([0-9]*);/)[1]);
      let classtype = line.match(/classtype:(.*?);/)[1];

      let message = line.match(/msg:"(.*?)"/)[1];
      let severity = line.match(/signature_severity.(.+?),/);

      if (severity && severity.constructor === Array) {
        severity = severity[1];
      }

      let enabled = true;
      if (line.charAt(0) == "#") {
        line = line.substr(1); //remove the hashtag
        enabled = false;
      }

      let rule_info = {
        sid: sid,
        revision: revision,
        classtype: classtype,
        enabled: enabled,
        published: enabled,
        severity: severity,
        ruleset: params.ruleset.name,
        message: message,
        rule_data: line,
        modified_time: new Date()
      };

      (async function () {
        try {

          let update_input, update_result, tag_rule, rs_tags = params.ruleset.tags, draft_input;
          let rule_found = await rule.findOne({where: {sid: sid}});

          if( classtype !== "" || classtype !== undefined ) {
            let classtype_found = await rule.app.models.rule_classtype.findOrCreate({where: {name: classtype}}, { name: classtype } );
            //hell.o([sid, "no rule found, create"], "checkRuleLine", "info");
          }

          /*
          CREATE RULE
           */
          if (!rule_found) {
            // hell.o([sid, "no rule found, create"], "checkRuleLine", "info");
            if (!params.ruleset.automatically_enable_new_rules) {
              rule_info.enabled = false;
            }
            let rule_create = await rule.create(rule_info);
            if (!rule_create) throw new Error("failed to create rule");

            //add tags if needed
            if (rs_tags.length > 0) {
              for (let i = 0, l = rs_tags.length; i < l; i++) {
                tag_rule = await rule_create.tags.add(rs_tags[i]);
                if (!tag_rule) throw new Error(sid + " failed to add new tag");
              }
            }

            //if automatically disable for ruleset, but rule should be enabled, add to drafts
            if (!params.ruleset.automatically_enable_new_rules && enabled) {
              hell.o([sid, "create draft"], "checkRuleLine", "info");
              draft_input = [{id: rule_create.id, enabled: true}];
              rule.app.models.rule_draft.more(draft_input, null, function () {
                hell.o([sid, "draft created"], "checkRuleLine", "info");
              });
            }

            return success(true);
          }

          /*
          SAME REVISION, CHECK IF ENABLED STILL UNCHANGED
           */
          if (rule_found.revision == revision) { //if same revision, only enable/disable changes
            if (rule_found.enabled == enabled) {
              // hell.o([sid, "no changes"], "checkRuleLine", "info");
              return success(true);
            }
          }

          /*
          AUTOMATIC UPDATE ALLOWED
           */
          if (params.ruleset.automatically_enable_new_rules) {
            hell.o([sid, "new revision update"], "checkRuleLine", "info");
            update_result = await rule.update({id: rule_found.id}, rule_info);
            if (!update_result) throw new Error(sid + " failed to update rule");
            hell.o([sid, "update ok"], "checkRuleLine", "info");
            return success(true);
          }

          /*
          AUTOMATIC UPDATES NOT ALLOWED, DRAFT IT
           */
          if (rule_found.revision == revision && rule_found.enabled != enabled) {
            //toggle enabled
            hell.o([sid, "enable change " + enabled], "checkRuleLine", "info");
            draft_input = [{id: rule_found.id, enabled: enabled}];

          } else { //must new revision

            delete rule_info.modified_time;
            rule_info.id = rule_found.id;
            draft_input = [rule_info];
          }

          hell.o([sid, "create draft"], "checkRuleLine", "info");

          rule.app.models.rule_draft.more(draft_input, null, function () {
            hell.o([sid, "draft created"], "checkRuleLine", "info");
            return success(true);
          });

        } catch (err) {
          hell.o([sid, err], "checkRuleLine", "error");
          reject(err);
        }

      })(); //async

    }); //promise

  };

  /**
   * EMERGING THREATS CHECKER
   *
   * @param cb
   */
  rule.rules_routine_active = false;
  rule.rulesRoutine = function (cb) {
    hell.o("start", "rulesRoutine", "info");

    if( rule.rules_routine_active == true ) {
      hell.o("rule check in progress", "rulesRoutine", "warn");
      //if (cb) return cb({name: "Error", status: 400, message: "worker_busy"});
      return;
    }

    (async () => {

      try {

        rule.rules_routine_active = true;

        let rules_downloaded = await fs.existsSync(PATH_SURICATA_EM_TEMP);

        //while testing do not download always
        if ( process.env.NODE_ENV != "dev" || !rules_downloaded ) {
          hell.o("no tar file, download again", "rulesRoutine", "info");
          let rules_tar_path = await rule.getEmergingThreatRulesFile();
        } else {
          hell.o("dev mode, do not redownload rules", "rulesRoutine", "info");
        }

        hell.o("extract", "rulesRoutine", "info");
        let extracted = await rule.extractEmergingThreatRulesFile();
        hell.o("scan dir for rule files", "rulesRoutine", "info");
        let extracted_files = await rule.readDirR(PATH_SURICATA_EM_RULES);
        hell.o("loop files", "rulesRoutine", "info");
        let filtered_files = await rule.loopRuleFiles(extracted_files);

        hell.o("remove files", "rulesRoutine", "info");
        let remove_files = await rule.removeFilesR( PATH_SURICATA_EM_RULES );

        hell.o("done", "rulesRoutine", "info");
        rule.rules_routine_active = false;

        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "rulesRoutine", "error");
        rule.rules_routine_active = false;

        cb({name: "name", status: 400, message: err.message});
      }

    })(); // async

  };

  //run on boot
  if (process.env.NODE_ENV != "dev") {
    rule.rulesRoutine(function () {});
  }

  rule.remoteMethod('rulesRoutine', {
    returns: {type: 'object', root: true},
    http: {path: '/checkRoutine', verb: 'get', status: 200}
  });

  /**
   * RETURN RULES PER DETECOTR
   *
   * get detector tags
   * get rules per tags
   * get rules without any tags
   * filtered by last_update
   *
   * @param detector_id
   * @param last_update : last changes from central
   * @returns {Promise}
   */
  rule.checkNewRulesForDetector = function (detector_id, last_update) {
    hell.o("start", "checkNewRulesForDetector", "info");
    return new Promise((success, reject) => {

      (async function () {
        try {

          let rule_fields = ["sid", "revision", "classtype", "severity", "ruleset",
            "enabled", "message", "rule_data", "modified_time"
            //, "created_time"
          ];

          let detector = await rule.app.models.detector.findById(detector_id, {
            include: {
              relation: "tags",
              scope: {
                // fields: ["id","name"]
              }
            }
          });

          let detector_tags = detector.tags();
          if (detector_tags.length > 0) {
            hell.o(["found tags for detector", detector_tags], "checkNewRulesForDetector", "info");
          }

          /*
          DETECTOR HAS TAGS
           */
          let rules_with_tags = [];
          if (detector.tags().length > 0) {

            let tags_filter = {
              where: {
                or: []
              },
              include: {
                relation: "rules"
              }
            };

            for (const t in detector.tags()) {
              tags_filter.where.or.push({"id": detector.tags()[t].id});
            }

            tags_filter.include.scope = {
              fields: rule_fields
            };

            if (last_update == "full") {
              hell.o("perform full update on rules", "checkNewRulesForDetector", "info");
            } else {
              tags_filter.include.scope.where = {
                modified_time: {gt: last_update}
              };
            }

            let look_for_rules_w_tags = await rule.app.models.tag.find(tags_filter);

            //do we have actual rules in tags?
            if (look_for_rules_w_tags.length > 0) {
              for (const r in look_for_rules_w_tags) {
                if (rules_with_tags.concat(look_for_rules_w_tags[r].rules().length > 0)) {
                  // console.log(look_for_rules_w_tags[r].rules().length);
                  rules_with_tags = rules_with_tags.concat(look_for_rules_w_tags[r].rules());
                }
              }
            }

            hell.o(["rules with tags", rules_with_tags.length], "checkNewRulesForDetector", "info");

          } // DETECTOR HAS TAGS

          let public_filter =
            {
              fields: rule_fields,
              include: {
                relation: "tags"
              }
            };

          if (last_update != "full") {
            public_filter.where = {
              modified_time: {gt: last_update}
            }
          }

          let new_rules = await rule.find(public_filter);

          //get public rules ( no tags )
          new_rules = new_rules.filter(function (t) {
            return t.tags().length == 0;
          });
          hell.o(["new rules without tags", new_rules.length], "checkNewRulesForDetector", "info");

          //merge rules with tags
          new_rules = new_rules.concat(rules_with_tags);

          for (let i = 0, l = new_rules.length; i < l; i++) {
            new_rules[i].id = undefined;
            delete new_rules[i].id;
          }

          hell.o(["total new rules", new_rules.length], "checkNewRulesForDetector", "info");
          hell.o("done", "checkNewRulesForDetector", "info");
          success(new_rules);

        } catch (err) {
          hell.o( err, "checkNewRulesForDetector", "error");
          reject(false);
        }

      })(); // async

    }); //promise

  };

};
