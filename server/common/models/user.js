'use strict';

const shelljs = require('shelljs');
const axios = require('axios');
const hell = new (require(__dirname + "/helper.js"))({module_name: "user"});

module.exports = function(user) {
  delete user.validations.email;
  delete user.validations.password;

  /**
   * CREATE USER
   *
   * add to moloch
   *
   * @param username
   * @param options
   * @param cb
   */
  user.createUser = function (username, options, cb) {
    hell.o("start", "createUser", "info");
    hell.o(username, "createUser", "info");

    (async function () {
      try {
        user.local_connection = axios.create({});

        let user_find = await user.findOne({where: {username: username }});
        if( user_find ) throw new Error("duplicate_data");

        let user_create = await user.create({ username: username });
        if (!user_create) throw new Error("failed to create user");

        /*
        if (process.env.NODE_ENV != "dev") {
          user.local_connection.post( "http://localhost:9200/_bulk",
            {
              "index":
                {"_index": "users",
                  "_type": "user",
                  "_id": username
                }
            },
            {
              "removeEnabled": false,
              "userName": username,
              "emailSearch": false,
              "enabled": true,
              "webEnabled": true,
              "headerAuthEnabled": true,
              "createEnabled": true,
              "settings": {},
              "passStore": "",
              "userId": username
            }
          );
        }
        */

        user_find = await user.findOne({where: {username: username }});

        hell.o("done", "createUser", "info");
        cb(null, user_find );
      } catch (err) {
        hell.o(err, "createUser", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  user.remoteMethod('createUser', {
    accepts: [
      {arg: 'username', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/createUser', verb: 'post', status: 200}
  });

  /**
   * BEFORE DELETE HOOK
   *
   * remove from passwd
   */
  user.observe('before delete', function (ctx, next) {
    hell.o("start", "delete", "info");
    // console.log('Going to delete %s matching %j', ctx.Model.pluralModelName, ctx.where );

    (async function () {
      try {

        if (process.env.NODE_ENV == "dev") { return next(); }

        hell.o("username", "delete", "info");
        let user_find = await user.findOne({where: {id: ctx.where.id.inq[0]}});
        hell.o(["user find", user_find], "delete", "info");

        let change_input = "htpasswd -D /etc/nginx/.htpasswd " + user_find.username;
        shelljs.exec(change_input, {silent: true}, function (exit_code, stdout, stderr) {
          hell.o(["shelljs result ", exit_code], "delete", "info");
          if (exit_code != 0) throw new Error(stderr);

          hell.o("done", "updatePassword", "info");

          next();
        });

      } catch (err) {
        hell.o(err, "updatePassword", "error");
        next();
      }

    })(); // async

  });


  /**
   * DELETE USER
   *
   * remove from moloch
   *
   * @param username
   * @param options
   * @param cb
   */

  /*
  user.deleteUser = function (username, options, cb) {
    hell.o("start", "deleteUser", "info");
    hell.o(username, "deleteUser", "info");

    (async function () {
      try {
        user.local_connection = axios.create({});

        let user_find = await user.findOne({where: {username: username }});
        if( !user_find ) throw new Error("no_data_found");

        //let user_remove = await user.destroyById({ id: user_find.id });
        //if (!user_remove) throw new Error("failed to remove user");

        let comp = await user.app.models.component.findOne({where: { name: "moloch", installed: true, enabled: true}})
        if ( comp && process.env.NODE_ENV != "dev") {
          user.local_connection.delete( "http://localhost:9200/users/user/" + username);
          user.local_connection = "";
        }

        hell.o("done", "deleteUser", "info");
        cb(null, {message: "ok"});
      } catch (err) {
        hell.o(err, "deleteUser", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  user.remoteMethod('deleteUser', {
    accepts: [
      {arg: 'username', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/deleteUser', verb: 'post', status: 200}
  });
  */

  /**
   * UPDATE USER PASSWORD
   *
   * change htpasswd
   *
   * @param username
   * @param password
   * @param options
   * @param cb
   */
  user.updatePassword = function (username, password, options, cb) {
    hell.o("start", "updatePassword", "info");
    hell.o(username, "updatePassword", "info");
    // hell.o(password, "updatePassword", "info");

    (async function () {
      try {

        if (process.env.NODE_ENV == "dev") { return next(); }

        let change_input = "htpasswd -b /etc/nginx/.htpasswd " + username + " \"" + password + "\"";
        shelljs.exec(change_input, {silent: true}, function (exit_code, stdout, stderr) {
          hell.o(["shelljs result ", exit_code], "updatePassword", "info");
          //let message = stderr;
          if (exit_code != 0) throw new Error(stderr);

          hell.o("done", "updatePassword", "info");
          cb(null, {message: "ok"});

        });

      } catch (err) {
        hell.o(err, "updatePassword", "error");
        cb(null, {name: "error", status: 400, message: err.message});
      }

    })(); // async

  };

  user.remoteMethod('updatePassword', {
    accepts: [
      {arg: 'username', type: 'string', required: true},
      {arg: 'password', type: 'string', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/updatePassword', verb: 'post', status: 200}
  });

};
