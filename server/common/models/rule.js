'use strict';

const https = require('https');
const tar = require('tar');
const fs = require('fs');
const walk = require('walkdir');

const LineByLineReader = require('line-by-line');
const hell = new (require(__dirname + '/helper.js'))({ module_name: 'rule' });

module.exports = function (rule) {
  /**
   * LOOP RULE FILES
   *
   * @param rule_files
   */
  rule.loopRuleFiles = async function (rule_files, feed) {
    hell.o('start', 'loopRuleFiles', 'info');

    const Ruleset = rule.app.models.ruleset;

    // return new Promise(function (success, reject) {

    // (async function () {

    let file_check,
      ruleset_check,
      ruleset_name,
      ruleset_insert,
      filename,
      loop_index = 0;
    for (let file_full_path of rule_files) {
      filename = file_full_path.split('/').pop();

      if (!filename.includes('.rules') || filename == feed.filename) {
        // hell.o([filename, " not rules file - ignore"], "loopRuleFiles", "info");
        continue;
      }

      hell.o([filename, 'loop'], 'loopRuleFiles', 'info');
      hell.o([file_full_path, 'loop'], 'loopRuleFiles', 'info');

      // if (!/\.rules$/.test(filename)) continue; // ignore not .rules files

      //import only a subset of all the rules while development / testing
      // if (process.env.NODE_ENV == "dev") {
      //   if (
      //     filename.includes("drop")
      //     ||
      //     filename.includes("pop3")
      //     ||
      //     filename.includes("shellcode")
      //     ||
      //     filename.includes("chat")
      //     ||
      //     filename.includes("info")
      //     // && feed.name == "emerging_pro" )
      //   ) {
      //   }
      //   else continue;
      //
      //
      //   // !filename.includes("drop")
      //   // !filename.includes("pop3") && !filename.includes("shellcode") &&
      //   // !filename.includes("telnet") && !filename.includes("chat") &&
      //   // !filename.includes("drop") && !filename.includes("ftp")
      //   // ) {
      //   // hell.o([filename, " dev mode - ignore"], "loopRuleFiles", "info");
      //   // continue;
      //   // } // for testing
      // }

      // hell.o([filename, "loop"], "loopRuleFiles", "info");

      ruleset_name = filename.replace('emerging-', '');
      ruleset_name = ruleset_name.replace('.rules', '');
      ruleset_insert = { name: ruleset_name };

      /*
      IF NEW RULESET, CREATE
       */
      hell.o([ruleset_name, 'find'], 'loopRuleFiles', 'info');
      ruleset_check = await Ruleset.findOrCreate({ where: ruleset_insert, include: ['tags'] }, ruleset_insert);
      if (!ruleset_check) throw new Error('failed to find / create ruleset');
      ruleset_check = ruleset_check[0];
      //hell.o("done", "checkNewRulesForDetector", "info");

      /*
      CHECK RULE FILE
       */
      // hell.o([ruleset_name, "check file"], "loopRuleFiles", "info");
      file_check = await rule
        .checkRuleFile({ path: file_full_path, ruleset: ruleset_check, feed: feed })
        .then((value) => {
          return value;
        })
        .catch((err) => {
          hell.o([ruleset_name, 'check file result'], 'loopRuleFiles', 'error');
          // reject( err );
          return err;
        });

      hell.o([ruleset_name, 'loop done for ' + file_check], 'loopRuleFiles', 'info');
      hell.o(['==================================='], 'loopRuleFiles', 'info');
      hell.o(['current file vs total files ' + loop_index, rule_files.length], 'loopRuleFiles', 'info');
      loop_index = loop_index + 1;
    }
    hell.o('done', 'loopRuleFiles', 'info');
    hell.o('===================================', 'loopRuleFiles', 'info');
    // success( true );
    return true;

    // })(); //async

    // }); //promise
  };

  /**
   * CHECK RULE FILE
   * line by line
   *
   * @param params
   */
  rule.checkRuleFile = function (params) {
    hell.o([params.ruleset.name, 'start'], 'checkRuleFile', 'info');

    return new Promise(function (success, reject) {
      let lineno = 0;
      let lr = new LineByLineReader(params.path);

      lr.on('error', function (err) {
        hell.o(err, 'checkRuleFile', 'error');
        reject(err);
        return err;
      });

      lr.on('line', function (line) {
        lineno++;

        //if( lineno % 6 ) lr.pause();
        lr.pause();

        if (lineno % 250 === 0) {
          //just to show activity in the logs
          hell.o([params.ruleset.name, 'looping new rules ' + lineno], 'checkRuleFile', 'info');
        }

        rule.checkRuleLine({ ruleset: params.ruleset, line: line, feed: params.feed }).then((value) => {
          lr.resume();
        });
      }); // lr.on

      lr.on('end', function () {
        hell.o([params.ruleset.name, 'done'], 'checkRuleFile', 'info');
        success(lineno);
        // return lineno;
      });
    }); // promise
  };

  /**
   * CHECK RULE LINE FROM FILE
   *
   * @param params
   */
  rule.checkRuleLine = async function (params) {
    //hell.o( "start" , "checkRuleLine", "info" );
    // return new Promise(function (success, reject) {

    let line = params.line;
    let feed = params.feed;
    let ruleset = params.ruleset;
    // console.log( [ feed.name, feed.tags()] );

    //not a rule line, comments etc
    if (!(line.startsWith('#alert') || line.startsWith('alert'))) return true; // console.log( line );

    let sid = undefined;
    try {
        sid = parseInt(line.match(/sid:([0-9]*);/)[1]);
    } catch(e) {
        hell.o(line, "checkRuleLineAAAA", "info");
        throw e;
    };
    // hell.o([sid, "start"], "checkRuleLine", "info");
    let revision = line.match(/rev:([0-9]*);/);
    if (revision === null) {
        revision = 1;
    } else {
        revision = parseInt(revision[1]);
    };
    let classtype = 'no-classtype';
    let classtype_check = line.match(/classtype:(.*?);/);
    if (classtype_check !== null) {
      classtype = classtype_check[1];
    }

    let message = line.match(/msg:\s*"(.*?)"/)[1];
    let severity = line.match(/signature_severity.(.+?),/);

    if (severity && severity.constructor === Array) {
      severity = severity[1];
    }

    let enabled = true;
    if (line.charAt(0) == '#') {
      line = line.substr(1); //remove the hashtag
      enabled = false;
    }

    let primary = false;
    if (feed.primary) {
      primary = true;
    }

    let rule_info = {
      sid: sid,
      revision: revision,
      primary: primary,
      feed_name: feed.name,
      classtype: classtype,
      enabled: enabled,
      published: enabled,
      severity: severity,
      ruleset: ruleset.name,
      message: message,
      rule_data: line,
      modified_time: new Date(),
    };

    // (async function () {
    try {
      //check if we have this classtype in db
      if (classtype !== undefined && classtype !== '' && classtype != null) {
        let classtype_found = await rule.app.models.rule_classtype.findOrCreate(
          { where: { name: classtype } },
          { name: classtype }
        );
      }

      let update_result,
        tag_rule,
        rs_tags = ruleset.tags(),
        fd_tags = feed.tags(),
        draft_input,
        create_extra = false,
        update_current = false,
        delete_current_feed_id = false,
        rule_to_change;

      //check if we have rules with the same SID
      let rule_found = await rule.find({ where: { sid: sid } });

      // hell.o([feed.name + " primary feed?: ", feed.primary], "checkRuleLine", "info");

      // hell.o([rule_found.revision, revision], "checkRuleLine", "info");

      if (rule_found.length > 2) {
        hell.o([sid, feed.name, 'found more than two'], 'checkRuleLine', 'error');
        return false;
      }

      // if( sid == 2102409 ){ // if( sid == 2400032 ){
      // console.log( "==========================" );console.log( "==========================" );console.log( "==========================" );
      // console.log( rule_info );
      // console.log( "==========================" );console.log( "==========================" );console.log( "==========================" );
      // console.log( rule_found );
      // console.log( "==========================" );console.log( "==========================" );console.log( "==========================" );
      // } else {
      //   return;
      // }

      if (ruleset.force_disabled === true) {
        enabled = false;
      }

      /**
       * ONE RULE FOUND IN DB
       */
      if (rule_found.length == 1) {
        // if( sid == 2400032 ){
        //   console.log( "found one");
        // }
        // hell.o([sid, feed.name, "found one"], "checkRuleLine", "info")

        //same feed and same rev, no changes
        rule_to_change = rule_found[0];

        //same rule, no changes
        if (rule_info.primary == rule_to_change.primary && rule_info.revision == rule_to_change.revision) {
          // hell.o([sid, feed.name, "no changes "], "checkRuleLine", "info");
          return true;
        }

        //if new is not primary, rev same
        if (!rule_info.primary && rule_to_change.primary && rule_info.revision == rule_to_change.revision) {
          // hell.o([sid, feed.name, "no changes "], "checkRuleLine", "info");
          return true;
        }

        //if new is primary, existing is not and same rev
        if (rule_info.primary && !rule_to_change.primary && rule_info.revision == rule_to_change.revision) {
          // hell.o([sid, feed.name, "existing and primary now the same, replace with primary"], "checkRuleLine", "info");
          delete_current_feed_id = rule_to_change.id;
          create_extra = true;
        }

        //if new is primary, existing is not
        if (rule_info.primary && !rule_to_change.primary) {
          // hell.o([sid, feed.name, "set create extra"], "checkRuleLine", "info");
          create_extra = true;
        }

        //same feed and new has higher rev
        if (rule_info.primary == rule_to_change.primary && rule_info.revision > rule_to_change.revision) {
          // hell.o([sid, feed.name, "set update current"], "checkRuleLine", "info");
          update_current = true;
        }
        //new is not primary and new has a higher rev
        // console.log( rule_info.primary, rule_to_change.primary, rule_info.revision, rule_to_change.revision );
        if (!rule_info.primary && rule_to_change.primary && rule_info.revision > rule_to_change.revision) {
          // hell.o([sid, feed.name, "set create new"], "checkRuleLine", "info");
          create_extra = true;
        }
      } // end of rule_found.length == 1

      /**
       * TWO RULES FOUND IN DB
       */
      let primary_rule, feed_rule;
      if (rule_found.length == 2) {
        // if( sid == 2400032 ){
        //   console.log( "found two");
        // }
        // hell.o([sid, feed.name, "found two"], "checkRuleLine", "info");
        for (let i = 0, l = rule_found.length; i < l; i++) {
          if (rule_found[i].primary == true) {
            primary_rule = rule_found[i];
            if (rule_info.primary) rule_to_change = primary_rule;
          } else {
            feed_rule = rule_found[i];
            if (!rule_info.primary) rule_to_change = feed_rule;
          }
        }

        //primary rule, no changes
        if (rule_info.primary && rule_info.revision == primary_rule.revision) {
          // hell.o([sid, feed.name, "no changes "], "checkRuleLine", "info");
          return true;
        }

        //feed rule, no changes
        if (!rule_info.primary && rule_info.revision == feed_rule.revision) {
          // hell.o([sid, feed.name, "no changes "], "checkRuleLine", "info");
          return true;
        }

        //if new is primary and has a higher rev, and new rev equals feed.rev
        if (
          rule_info.primary &&
          rule_info.revision > primary_rule.revision &&
          rule_info.revision == feed_rule.revision
        ) {
          // hell.o([sid, feed.name, "existing and primary now the same, replace with primary"], "checkRuleLine", "info");
          delete_current_feed_id = feed_rule.id;
          update_current = true;
        }

        //if new is feed and has higher rev
        if (!rule_info.primary && rule_info.revision > feed_rule.revision) {
          update_current = true;
        }
      } //end of rule_found.length == 2

      /**
       * NO RULES FOUND IN DB, CREATE
       */
      if (rule_found.length == 0 || create_extra === true) {
        // hell.o([sid, "no rule found, create"], "checkRuleLine", "info");

        // if( sid == 2400032 ){
        //   console.log( "none found");
        // }
        // console.log( feed.tags );
        // console.log( rs_tags );
        // console.log( fd_tags );
        if (!ruleset.skip_review) {
          rule_info.enabled = false;
        }
        let rule_create = await rule.create(rule_info);
        if (!rule_create) throw new Error('failed to create rule');

        //add tags from ruleset
        if (rs_tags !== undefined && rs_tags.length > 0) {
          for (let i = 0, l = rs_tags.length; i < l; i++) {
            tag_rule = await rule_create.tags.add(rs_tags[i]);
            if (!tag_rule) throw new Error(sid + ' failed to add new tag from ruleset');
          }
        }

        //add tags from feed, if not primary
        if (!feed.primary && fd_tags !== undefined && fd_tags.length > 0) {
          // console.log( "FEED TAGS::::::::::" );
          // console.log( fd_tags );
          for (let i = 0, l = fd_tags.length; i < l; i++) {
            tag_rule = await rule_create.tags.add(fd_tags[i]);
            if (!tag_rule) throw new Error(sid + ' failed to add new tag from feed');
          }
        }

        if (ruleset.skip_review) return true;

        rule_to_change = rule_create;
      } //rule_found.length == 0

      /**
       * REMOVE CURRENT FEED RULE by id
       */
      if (delete_current_feed_id !== false) {
        hell.o([sid, feed.name, 'remove current feed rule'], 'checkRuleLine', 'info');
        let rule_remove = await rule.destroyById(delete_current_feed_id);
      }

      /**
       * IF RULE HAS FORCE DISABLED
       */
      if (rule_to_change.force_disabled) {
        enabled = false;
        rule_to_change.enabled = false;
        rule_info.enabled = false;
      }

      /**
       * AUTOMATIC UPDATE ALLOWED
       */
      if (ruleset.skip_review && update_current) {
        hell.o([sid, 'new revision update'], 'checkRuleLine', 'info');
        hell.o([feed.name + ' primary feed: ', feed.primary], 'checkRuleLine', 'info');
        update_result = await rule.update({ id: rule_to_change.id }, rule_info);
        if (!update_result) throw new Error(sid + ' failed to update rule');
        hell.o([sid, 'update ok'], 'checkRuleLine', 'info');
        return true;
      }

      /**
       * AUTOMATIC UPDATES NOT ALLOWED, DRAFT IT
       */

      // console.log( rule_info );
      // if( sid == 2400032 ){
      //   console.log( rule_info );
      //   console.log( "==========================" );
      //   console.log( rule_to_change );
      // }
      if (rule_to_change.revision == revision && rule_to_change.enabled != enabled) {
        //toggle enabled
        // hell.o([sid, "enable change " + enabled], "checkRuleLine", "info");
        draft_input = { id: rule_to_change.id, enabled: enabled };
      } else {
        //must be new revision
        delete rule_to_change.modified_time;
        // rule_to_change.id = rule_to_change.id;
        draft_input = rule_to_change;
      }

      hell.o([sid, 'create draft'], 'checkRuleLine', 'info');
      await rule.addToDraft(draft_input);

      // rule.app.models.rule_draft.more(draft_input, null, function () {
      //   hell.o([sid, "draft created"], "checkRuleLine", "info");
      //   // return success(true);
      //   return true;
      // });

      return true;
    } catch (err) {
      hell.o([sid, err], 'checkRuleLine', 'error');
      // reject(err);
      return false;
    }

    // })(); //async

    // }); //promise
  };

  rule.addToDraft = async function (draft_input) {
    hell.o([draft_input.sid, 'add to draft'], 'addToDraft', 'info');

    rule.app.models.rule_draft.more([draft_input], null, function () {
      hell.o([draft_input.sid, 'done'], 'addToDraft', 'info');
      // return success(true);
      return true;
    });
  };

  /**
   * RETURN RULES PER DETECTOR
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
  rule.checkNewRulesForDetector = async function (detector_id, last_update) {
    hell.o('start', 'checkNewRulesForDetector', 'info');
    hell.o(['last update', last_update], 'checkNewRulesForDetector', 'info');
    // return new Promise((success, reject) => {

    // (async function () {
    try {
      let rule_fields = [
        'sid',
        'revision',
        'classtype',
        'severity',
        'ruleset',
        'enabled',
        'message',
        'rule_data',
        'modified_time',
        //, "created_time"
      ];

      let detector = await rule.app.models.detector.findById(detector_id, {
        include: {
          relation: 'tags',
          scope: {
            // fields: ["id","name"]
          },
        },
      });

      let detector_tags = detector.tags();

      /**
       * DETECTOR HAS TAGS
       */
      let rules_with_tags = [];
      if (detector.tags().length > 0) {
        hell.o(['found tags for detector', detector_tags], 'checkNewRulesForDetector', 'info');

        let tags_filter = {
          where: {
            or: [],
          },
          include: {
            relation: 'rules',
            scope: {
              fields: rule_fields,
            },
          },
        };

        for (const t in detector.tags()) {
          tags_filter.where.or.push({ id: detector.tags()[t].id });
          console.log('tag for Where Or', detector.tags()[t].id);
        }

        // tags_filter.include.scope = {
        //   fields: rule_fields
        // };

        if (last_update == 'full') {
          hell.o('perform full update on rules', 'checkNewRulesForDetector', 'info');
        } else {
          tags_filter.include.scope.where = {
            modified_time: { gt: last_update },
          };
        }

        // console.log( "tags_filter" );
        // console.log( tags_filter );
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

        hell.o(['rules with tags', rules_with_tags.length], 'checkNewRulesForDetector', 'info');
      } // DETECTOR HAS TAGS

      let public_filter = {
        include: {
          relation: 'tags',
          scope: {
            fields: rule_fields,
          },
        },
      };

      if (last_update != 'full') {
        public_filter.where = {
          modified_time: { gt: last_update },
        };
      }

      let new_rules = await rule.find(public_filter);

      //get public rules ( no tags )
      new_rules = new_rules.filter(t => t.tags().length === 0);
      hell.o(['rules without tags', new_rules.length], 'checkNewRulesForDetector', 'info');

      //merge rules with tags
      new_rules = new_rules.concat(rules_with_tags);

      let temp_rule;
      for (let i = 0, l = new_rules.length; i < l; i++) {
        // console.log( new_rules[i].sid, new_rules[i].revision );

        temp_rule = {
          sid: new_rules[i].sid,
          revision: parseInt(new_rules[i].revision),
          classtype: new_rules[i].classtype,
          severity: new_rules[i].severity,
          ruleset: new_rules[i].ruleset,
          enabled: new_rules[i].enabled,
          message: new_rules[i].message,
          rule_data: new_rules[i].rule_data,
        };

        new_rules[i] = temp_rule;
      }

      // console.log( new_rules );

      hell.o(['total new rules', new_rules.length], 'checkNewRulesForDetector', 'info');
      hell.o('done', 'checkNewRulesForDetector', 'info');
      // success(new_rules);
      return new_rules;
    } catch (err) {
      hell.o(err, 'checkNewRulesForDetector', 'error');
      // reject(false);
      return false;
    }

    // })(); // async

    // }); //promise
  };

  /**
   * Add a job to job_schedule to perform a full sync for rules
   *
   * @param detectorId
   * @param tagId
   */
  rule.addJobForFullSync = function (detectorId, tagId, cb) {
    hell.o('start', 'addJobForFullSync', 'info');

    (async function () {
      try {
        hell.o([detectorId, 'detectorId'], 'addJobForFullSync', 'info');
        let detector = await rule.app.models.detector.findOne({ where: { id: detectorId } });
        if (!detector) throw new Error('can not find detector');

        let tag = await rule.app.models.tag.findOne({ where: { id: tagId } });
        if (!tag) throw new Error('can not find tag');

        let job = {
          target: detector.name,
          targetId: detector.id,
          detectorId: detector.id,
          name: 'rulesFullSync',
          description: 'Perform a full sync for rules',
          ignore_duplicate: true,
        };

        // console.log( job.data );
        hell.o('add full sync rules job to schedule', 'addJobForFullSync', 'info');
        let job_result = await rule.app.models.job_schedule.jobAdd(job);
        if (!job_result)
          throw new Error('failed to add rulesFullSync job to schedule, detector will have current rules');
        hell.o('job added', 'addJobForFullSync', 'info');

        hell.o([detectorId, 'done'], 'addJobForFullSync', 'info');
        if (cb) return cb(null, { message: 'ok' });
        return true;
      } catch (err) {
        hell.o(err, 'addJobForFullSync', 'error');
        if (cb) return cb({ name: 'Error', status: 400, message: 'Central failed to process the request' });
        return false;
      }
    })(); // async
  };

  rule.remoteMethod('addJobForFullSync', {
    accepts: [
      { arg: 'detectorId', type: 'string', required: true },
      { arg: 'tagId', type: 'string', required: true },
    ],
    returns: { type: 'object', root: true },
    http: { path: '/addJobForFullSync', verb: 'post', status: 201 },
  });

  /**
   * Add a job to job_schedule to remove rules
   *
   * @param detectorId
   * @param tagId
   */
  rule.addJobForDeleteRules = function (detectorId, tagId, cb) {
    hell.o('start', 'addJobForDeleteRules', 'info');

    (async function () {
      try {
        hell.o([detectorId, 'detectorId'], 'addJobForDeleteRules', 'info');
        let detector = await rule.app.models.detector.findOne({ where: { id: detectorId } });
        if (!detector) throw new Error('can not find detector');

        let tag = await rule.app.models.tag.findOne({ where: { id: tagId } });
        if (!tag) throw new Error('can not find tag');

        /**
         * find rules with the tag
         */
        let tags_filter = {
          where: {
            id: tag.id,
          },
          include: {
            relation: 'rules',
            scope: {
              fields: ['sid'],
            },
          },
        };

        // console.log( "tags_filter" );
        // console.log( tags_filter );
        let look_for_rules_w_this_tag = await rule.app.models.tag.find(tags_filter);
        if (look_for_rules_w_this_tag.length == 0 && look_for_rules_w_this_tag[0].rules().length > 0) {
          if (cb) return cb(null, { message: 'ok' });
          return true;
        }

        let output_rules = [];
        look_for_rules_w_this_tag[0].rules().forEach(function (v) {
          output_rules.push({ sid: v.sid });
        });

        let job = {
          target: detector.name,
          targetId: detector.id,
          detectorId: detector.id,
          data: { rules: output_rules },
          name: 'rulesRemove',
          description: 'Remove some rules',
        };

        // console.log( job.data );
        hell.o('add remove rules job to schedule', 'addJobForDeleteRules', 'info');
        let job_result = await rule.app.models.job_schedule.jobAdd(job);
        if (!job_result)
          throw new Error('failed to add addJobForDeleteRules job to schedule, detector will have current rules');
        hell.o('job added', 'addJobForDeleteRules', 'info');

        hell.o([detectorId, 'done'], 'addJobForDeleteRules', 'info');
        if (cb) return cb(null, { message: 'ok' });
        return true;
      } catch (err) {
        hell.o(err, 'addJobForDeleteRules', 'error');
        if (cb) return cb({ name: 'Error', status: 400, message: 'Central failed to process the request' });
        return false;
      }
    })(); // async
  };

  rule.remoteMethod('addJobForDeleteRules', {
    accepts: [
      { arg: 'detectorId', type: 'string', required: true },
      { arg: 'tagId', type: 'string', required: true },
    ],
    returns: { type: 'object', root: true },
    http: { path: '/addJobForDeleteRules', verb: 'post', status: 201 },
  });
};
