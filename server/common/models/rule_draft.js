'use strict';
const hell = new (require(__dirname + "/helper.js"))({module_name: "rule_draft"});

module.exports = function (rule_draft) {

  const CUSTOM_RULESET_NAME = "cert";

  rule_draft.more = function (changes, options, cb) {
    hell.o("start", "more", "info");

    if (changes.length == 0) {
      hell.o("no changes", "more", "warn");
      cb({name: "Error", status: 400, message: "no_changes"});
      return;
    }
    // hell.o(changes, "more", "info");

    const rule = rule_draft.app.models.rule;
    (async function () {
      try {

        /*
        HACK EDIT MODAL to smaller pieces if more changes
         */
        // console.log( "changes", changes );
        if (changes.length == 1 && changes[0].id !== undefined && Object.keys(changes[0]).length > 5
        ) {
          //hell.o("more changes, hack to objects", "more", "info");

          let edit_fields = [];
          let edit_keys = Object.keys(changes[0]);

          let field;
          for (const ef of edit_keys) {
            if (ef == "id") continue;

            field = {id: changes[0].id};
            field[ef] = changes[0][ef];
            // console.log( field );
            edit_fields.push(field);
          }
          changes = edit_fields;
        }

        let field_to_update, find_sid, find_draft_sid, current, original, found, original_id, draft,
          input_to_draft, update_input, update_result, add_result, tmp;
        for (let i = 0, l = changes.length; i < l; i++) {

          current = changes[i];

          /*
           IF NEW CERT/CUSTOM RULE, create
           */
          if (current.ruleset == CUSTOM_RULESET_NAME && current.id === undefined) {
            hell.o([current.sid, "new rule"], "more", "info");

            find_draft_sid = await rule_draft.find({where: {sid: current.sid}, fields: ["sid"]});
            find_sid = await rule_draft.app.models.rule.find({where: {sid: current.sid}, fields: ["sid"]});
            hell.o([current.sid, "look for duplicate sid"], "more", "info");
            hell.o([find_draft_sid, find_sid], "more", "info");

            if (!find_draft_sid) throw new Error(current.sid + " failed to look for draft sid ");
            if (find_draft_sid.length > 0) throw new Error(current.sid + " draft SID already exists ");
            if (!find_sid) throw new Error(current.sid + " draft failed to look for rule sid ");
            if (find_sid.length > 0) throw new Error(current.sid + " rule SID already exists ");

            hell.o([current.sid, "no duplicate, continue"], "more", "info");

            if (current.tags_changes.length > 0) {
              for (let ni = 0, nl = current.tags_changes.length; ni < nl; ni++) {
                current.tags_changes[ni] = {id: current.tags_changes[ni], added: true}; //fix missing tag
              }
            }

            current.new_rule = true;

            let create_new = await rule_draft.create(current);
            if (!create_new) throw new Error(current.sid + " failed to create new custom rule");

            hell.o([current.sid, "new custom draft created"], "more", "info");

            continue;
          } //if new

          tmp = Object.keys(current);
          // console.log(Object.keys(current));
          field_to_update = tmp[1];
          // hell.o(["field_to_update", field_to_update], "more", "info");

          /*
          GET ORIGINAL RULE
           */
          original = await rule.findOne({where: {id: current.id}, include: ['tags']});
          hell.o([original.sid, "original sid"], "more", "info");
          if (!original) throw new Error(original.sid + " failed to get original rule");
          draft = await rule_draft.find({where: {ruleId: current.id}});
          if (!draft) throw new Error(original.sid + " failed to get draft");
          if (draft.length > 0) {
            draft = draft[0];
          } else draft = false;

          /*
          TAGS UNCHANGED, ignore
           */
          if (current.tags_changes !== undefined && current.tags_changes[0].added) {
            try {
              let otag_check = await original.tags.findById(current.tags_changes[0].id);
              //found tag, continue
              hell.o([original.sid, "this rule already has the tag, continue"], "more", "info");

              if (!draft || draft.tags_changes.length == 0) continue;

              hell.o([original.sid, "this rule has a draft, check if we have opposite tag change stored"], "more", "info");
              found = false, update_input = [];

              for (let i = 0, l = draft.tags_changes.length; i < l; i++) {
                if (draft.tags_changes[i].id == current.tags_changes[0].id) {
                  found = true;
                  continue;
                }
                update_input.push(draft.tags_changes[i]);
              }

              if (found) {
                hell.o([original.sid, "found tag in draft, remove"], "more", "info");
                update_result = await rule_draft.update({id: draft.id}, {tags_changes: update_input});
                if (!update_result) throw new Error(original.sid + " failed to update draft");
              }

              continue;
            } catch (err) {
              hell.o([original.sid, "no such tag, continue"], "more", "info");
            }
          }

          /*
          ORIGINAL AND UPDATE SAME, ignore
           */
          if (!draft && original[field_to_update] == current[field_to_update]) {
            hell.o([original.sid, "no draft: original and update same, return"], "more", "info");
            // console.log( original.sid + " " + original[field_to_update]);
            // console.log( original.sid + " " + current[field_to_update]);
            continue;
          }

          /*
          DRAFT AND UPDATE SAME, ignore
           */
          if (draft !== false && draft[field_to_update] == current[field_to_update]) {
            hell.o([original.sid, "original and draft same, return"], "more", "info");
            // console.log( original.sid + " " + draft[field_to_update]);
            // console.log( original.sid + " " + current[field_to_update]);
            continue;
          }

          /*
          NO DRAFT, create it
           */
          if (!draft) {
            hell.o([original.sid, "create draft"], "more", "info");

            input_to_draft = {};
            input_to_draft = original.toJSON();
            input_to_draft.ruleId = current.id;
            delete input_to_draft.id;
            input_to_draft.tags_changes = [];

            add_result = await rule_draft.create(input_to_draft);
            if (!add_result) throw new Error(original.sid + " failed to create draft");

          }

          hell.o([original.sid, " try to find ruleId: " + current.id], "more", "info");

          draft = await rule_draft.findOne({where: {ruleId: current.id}});
          if (!draft) throw new Error(original.sid + " failed to find draft ");

          /*
          IF NO TAGS, add | CHECK remove tag part...
           */
          let update_result;
          if (field_to_update == "tags_changes" && draft.tags_changes.length == 0) {
            hell.o([original.sid, " no tags, add to draft"], "more", "info");
            hell.o([original.sid, draft.tags_changes], "more", "info");

            update_result = await rule_draft.update({id: draft.id}, {tags_changes: current.tags_changes});
            if (!update_result) throw new Error(original.sid + " failed add tags to draft ");
          }

          /*
          HAS TAGS, update
           */
          if (field_to_update == "tags_changes" && draft.tags_changes.length > 0) {
            hell.o([original.sid, " has tags, check draft"], "more", "info");

            let dt, need_to_update = false, update_tags = draft.tags_changes,
              found = false, ct = current.tags_changes[0]; //for now there is only one tag change

            for (let i = 0, l = draft.tags_changes.length; i < l; i++) {
              dt = draft.tags_changes[i];

              if (ct.id == dt.id) {
                found = true;
                if (ct.added == dt.added) { //found, nothing to change
                  hell.o([original.sid, " same tag"], "more", "info");
                  hell.o([original.sid, ct], "more", "info");
                } else {
                  hell.o([original.sid, " same tag, remove"], "more", "info");
                  hell.o([original.sid, ct], "more", "info");
                  update_tags.splice(i, 1); //same index
                  need_to_update = true;
                }
              }

            }

            if (!found) { //tag not found, new
              hell.o([original.sid, " no tag found, add to array"], "more", "info");
              hell.o([original.sid, ct], "more", "info");
              update_tags.push(ct);
              need_to_update = true;
            }

            if (need_to_update) {
              hell.o([original.sid, " need to update tags"], "more", "info");
              hell.o([original.sid, "update_tags"], "more", "info");

              update_result = await rule_draft.update({id: draft.id}, {tags_changes: update_tags});
              if (!update_result) throw new Error(original.sid + " failed update tags for draft ");
            }

          } // tags check

          /*
          UPDATE DRAFT
           */
          if (field_to_update != "tags_changes" && draft[field_to_update] != current[field_to_update]) {
            hell.o([original.sid, " draft make change: " + draft.sid], "more", "info");

            update_input = {};
            update_input[field_to_update] = current[field_to_update];

            update_result = await rule_draft.update({id: draft.id}, update_input);
            if (!update_result) throw new Error(original.sid + " failed update field " + field_to_update + " for draft " + draft.sid);

          }

          /*
          RELOAD
           */
          draft = await rule_draft.findOne({where: {ruleId: current.id}});
          if (!draft) throw new Error(original.sid + " failed to reload draft ");

          let matcher = ["sid", "enabled", "force_disabled", "revision", "classtype", "severity", "message", "rule_data"];
          update_input = [];
          hell.o([original.sid, "match values again"], "more", "info");
          for (let i = 0, l = matcher.length; i < l; i++) {
            if (draft[matcher[i]] != original[matcher[i]]) {
              hell.o([original.sid, "not matching: " + matcher[i]], "more", "info");
              update_input.push(matcher[i]);
            }
          }

          if (update_input.length > 0) {
            hell.o([original.sid, "update draft changes_fields"], "more", "info");
            hell.o([original.sid, update_input], "more", "info");
            update_result = await rule_draft.update({id: draft.id}, {changes_fields: update_input});
            if (!update_result) throw new Error(original.sid + " failed update changes_fields for draft " + draft.sid);
          }

          if (update_input.length == 0 && draft.tags_changes.length == 0) {

            hell.o([original.sid, "draft is same as original, remove"], "more", "info");
            //changes result back to original, remove from draft
            let delete_draft = await rule_draft.destroyById(draft.id); //
            if (!delete_draft) throw new Error(original.sid + " failed to remove draft " + draft.sid);

          }

        } // end of changes for loop

        let final_sid = "new";
        if (original && original.sid) final_sid = original.sid;
        hell.o([final_sid, "done"], "more", "info");
        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "more", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  rule_draft.remoteMethod('more', {
    accepts: [
      {arg: 'changes', type: 'array', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/more', verb: 'post', status: 201}
  });


  /**
   * RULES DRAFT CLEAR
   *
   * @param options
   * @param cb
   */
  rule_draft.clear = function (options, cb) {
    hell.o("start", "clear", "info");

    (async function () {
      try {

        let trunc_result = await rule_draft.destroyAll();
        if (!trunc_result) throw new Error("delete_failed");

        hell.o("done", "clear", "info");
        cb(null, {message: "ok"});
      } catch (err) {
        hell.o(err, "clear", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  rule_draft.remoteMethod('clear', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/clear', verb: 'post', status: 201}
  });

  /**
   * RULES PUBLISH
   *
   * @param options
   * @param cb
   */
  rule_draft.publish = function (options, cb) {
    hell.o("start", "publish", "info");

    (async function () {
      try {

        let rule = rule_draft.app.models.rule;
        let tag = rule_draft.app.models.tag;

        hell.o("find drafts", "publish", "info");
        let drafts = await rule_draft.find({});

        let draft, draft_tags, published_rule, published_input, update_result, tag_exists, tag_found, tag_update_result;
        for (let i = 0, l = drafts.length; i < l; i++) {
          draft = drafts[i];

          hell.o([draft.sid, "loop"], "publish", "info");

          /*
          NEW RULE
           */
          if (draft.new_rule) {
            hell.o([draft.sid, "new rule"], "publish", "info");

            let dup_sid = await rule.findOne({where: {sid: draft.sid}});
            if (dup_sid && dup_sid.sid == draft.sid) {
              hell.o([draft.sid, "duplicated SID"], "publish", "info");
              throw new Error(draft.sid + " duplicate SID for rule draft " + draft.sid);
            }

            let new_rule_input = {
              sid: draft.sid,
              revision: 1, // new rule
              primary: draft.primary,
              feed_name: draft.feed_name,
              message: draft.message,
              classtype: draft.classtype,
              ruleset: draft.ruleset,
              enabled: draft.enabled,
              force_disabled: draft.force_disabled || false,
              rule_data: draft.rule_data,
              created_time: new Date(),
              modified_time: new Date()
            };

            hell.o([draft.sid, "create rule"], "publish", "info");
            update_result = await rule.create(new_rule_input);
            if (!update_result) throw new Error(draft.sid + " failed create new rule");
            draft.ruleId = update_result.id;
          }


          /*
          GET PUBLISHED RULE
           */
          hell.o([draft.sid, "published rule " + draft.ruleId], "publish", "info");
          [published_rule] = await rule.find({where: {id: draft.ruleId}, include: ["tags"]});
          if (!published_rule) throw new Error(draft.sid + " failed to find rule");

          if (draft.changes_fields !== undefined && draft.changes_fields.length > 0) {
            let cur_up;
            let update_input = {};

            for (let i = 0, l = draft.changes_fields.length; i < l; i++) {
              cur_up = draft.changes_fields[i];
              hell.o([draft.sid, "update field " + cur_up], "publish", "info");
              // hell.o([draft.sid, published_rule[cur_up], draft[cur_up] ], "publish", "info");
              update_input[cur_up] = draft[cur_up];
            }

            if (draft.ruleset == CUSTOM_RULESET_NAME) {
              update_input.revision = parseInt(published_rule.revision) + 1; //increment revision
            }
            update_input.modified_time = new Date();

            // hell.o( [ draft.sid, update_input ],"publish","info");
            update_result = await rule.update({id: published_rule.id}, update_input);
            if (!update_result) throw new Error(draft.sid + " failed to update rule " + published_rule.sid);
            hell.o([draft.sid, "updated"], "publish", "info");
          }

          /*
            HAS TAGS TO CHANGE?
           */
          draft_tags = draft.tags_changes;
          if (draft_tags.length > 0) {
            hell.o([draft.sid, "tags len " + draft_tags.length], "publish", "info");

            for (let ti = 0, tl = draft_tags.length; ti < tl; ti++) {

              if (draft_tags[ti].added === undefined) continue;

              hell.o([draft.sid, "find tag"], "publish", "info");
              tag_exists = await tag.findOne({where: {id: draft_tags[ti].id}});
              if (!tag_exists) {
                hell.o([draft.sid, "failed to find such tag in the tabase"], "publish", "info");
                hell.o([draft.sid, draft_tags[ti]], "publish", "info");
                continue;
              }

              tag_found = await published_rule.tags.exists(tag_exists);

              //throw new Error("rule_draft.publish tag not found");
              if (draft_tags[ti].added && !tag_found) {
                hell.o([draft.sid, "try to add tag"], "publish", "info");
                hell.o([draft.sid, draft_tags[ti]], "publish", "info");

                tag_update_result = await published_rule.tags.add(tag_exists);
                hell.o([draft.sid, "tag add result "], "publish", "info");
                hell.o([draft.sid, tag_update_result], "publish", "info");
                // if (!tag_update_result) throw new Error("rule_draft.publish tag add failed " + published_rule.sid);

              }

              if (!draft_tags[ti].added && tag_found) {
                hell.o([draft.sid, "try to remove tag"], "publish", "info");
                hell.o([draft.sid, draft_tags[ti]], "publish", "info");

                tag_update_result = await published_rule.tags.remove(tag_exists);
                hell.o([draft.sid, "tag add result "], "publish", "info");
                hell.o([draft.sid, tag_update_result], "publish", "info");
                // if (!tag_update_result) throw new Error("rule_draft.publish tag remove failed " + published_rule.sid);

              }

            } //tags for loop

          } // tags

          hell.o([draft.sid, "remove draft"], "publish", "info");
          let remove_draft = await rule_draft.destroyById(draft.id);
          if (!remove_draft) throw new Error(draft.sid + " failed to remove draft");
          hell.o([draft.sid, "draft removed"], "publish", "info");

        } // drafts for loop

        cb(null, {message: "ok"});
      } catch (err) {
        hell.o(err, "publish", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  rule_draft.remoteMethod('publish', {
    accepts: [
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/publish', verb: 'post', status: 201}
  });

};
