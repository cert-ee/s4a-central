'use strict';

const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "roles"});

module.exports = function (app) {

  hell.o("start", "roles", "info");
  /*
  CREATE DEFAULT USER AND ROLES
   */
  const default_users = [
    {username: 'admin', roles: ['read', 'admin']},
    {username: 'monitoring', roles: ['monitoring']}
  ];

  const default_roles = [
    {name: 'admin', description: 'Full access'},
    {name: 'read', description: 'Read only'},
    {name: 'monitoring', description: 'Monitoring'},
    {name: 'detector', description: 'Detector'},
  ];

  (async () => {
    try {

      let role, user, principal;
      //create default roles
      for (let default_role of default_roles) {
        role = await app.models.role.findOrCreate({where: {name: default_role.name}}, default_role);
      }

      //create default users
      for (let default_user of default_users) {
        user = await app.models.user.findOrCreate({where: {username: default_user.username}}, {username: default_user.username});

        //add default user roles if needed
        for (const user_role of default_user.roles) {
          role = await app.models.role.findOne({where: {name: user_role}});
          principal = {principalType: app.models.roleMapping.USER, principalId: user[0].id};

          let exists = await role.principals.findOne({where: {principalId: principal.principalId}});
          if (!exists) {
            await role.principals.create(principal);
          }
        }

      }

      hell.o("done", "roles", "info");
    } catch (err) {
      hell.o(err, "roles", "error");
    }
  })();

};
