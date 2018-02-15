'use strict';

const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "roles"});

module.exports = function (app) {

  /*
  CREATE DEFAULT USER AND ROLES
   */
  const Role = app.models.role;
  const User = app.models.user;
  const RoleMapping = app.models.roleMapping;

  const admins = [
    {username: 'admin'}
  ];

  const roles = [
    {name: 'admin', description: 'Full access'},
    {name: 'read', description: 'Read only'},
    {name: 'detector', description: 'Detector'},
  ];

  hell.o("start", "init", "info");
  for (const role of roles) {
    Role.findOrCreate({where: role}, role, (err, role) => {
      if (err) throw err;
      if (role.name !== 'admin') return;

      for (const admin of admins) {
        User.findOrCreate({where: admin}, admin, (err, admin) => {
          if (err) throw err;
          let principal = {principalType: RoleMapping.USER, principalId: admin.id};

          role.principals({where: principal}, (err, principals) => {
            if (err) throw err;
            if (principals && principals.length) return;
            role.principals.create(principal, (err) => {
              if (err) throw err;
            });
          });
        });
      }
    });
  }
  hell.o("done", "init", "info");
};
