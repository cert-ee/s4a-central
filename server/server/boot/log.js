const bunyanMongoDbLogger = require('bunyan-mongodb-logger');

module.exports = function(app) {
  const mongoURL = app.datasources.db.settings.url;

  const logger = bunyanMongoDbLogger({
    name: 'S4a central API log',
    stream: 'mongodb',
    url: mongoURL,
    collections: 'log'
  });

  const User = app.models.user;
  const Role = app.models.role;
  const RoleMapping = app.models.roleMapping;

  User.observe('after save', async (ctx) => {
    if (!ctx.isNewInstance) return Promise.resolve();
    const model = ctx.Model.modelName;
    const userId = ctx.options.accessToken ? ctx.options.accessToken.userId : null;
    const username = ctx.instance.username;

    if (userId) {
      try {
        const user = await User.findOne({ where: {id: userId} });
        const msg = `${user.username} added user ${username}`;
        logger.info({model, user: user.username, hook: 'after save', target: username}, msg);
      } catch (err) {
        const msg = `User with ID ${userId} added user ${username}. Error occured looking up user ID: ${err.message}`;
        logger.info({model, user: userId, hook: 'after save', target: username}, msg);
      }
    } else {
      const msg = `${username} logged in for the first time, user created`;
      logger.info({model, user: 'SYSTEM', hook: 'after save', target: username}, msg);
    }

    return Promise.resolve();
  });

  User.observe('before delete', async (ctx) => {
    const model = ctx.Model.modelName;
    const userId = ctx.options.accessToken.userId;
    const deletedId = ctx.where.id.inq[0];

    try {
      const users = await User.find({ where: {or: [{id: userId}, {id: deletedId}]} });
      const user = users.find(u => u.id.toString() === userId.toString());
      const deletedUser = users.find(u => u.id.toString() === deletedId.toString());
      const msg = `${user.username} deleted user ${deletedUser.username}`;
      logger.info({model, user: user.username, hook: 'before delete', target: deletedUser.username}, msg);
    } catch (err) {
      const msg = `User with ID ${userId} deleted user with ID ${deletedId}. Error occured looking up user IDs: ${err.message}`;
      logger.info({model, user: userId, hook: 'before delete', target: deletedId}, msg);
    }

    return Promise.resolve();
  });

  RoleMapping.observe('after save', async (ctx) => {
    if (!ctx.isNewInstance) return Promise.resolve();
    const model = ctx.Model.modelName;
    const userId = ctx.options.accessToken ? ctx.options.accessToken.userId : null;
    const principalId = ctx.instance.principalId;
    const roleId = ctx.instance.roleId;

    if (userId) {
      try {
        const usersPromise = User.find({ where: {or: [{id: userId}, {id: principalId}]} });
        const rolePromise = Role.findOne({ where: {id: roleId} });
        const [users, role] = await Promise.all([usersPromise, rolePromise]);
        const user = users.find(u => u.id.toString() === userId.toString());
        const principal = users.find(u => u.id.toString() === principalId.toString());
        const msg = `${user.username} added role ${role.name} to ${principal.username}`;
        logger.info({model, user: user.username, hook: 'after save', target: principal.username}, msg);
      } catch (err) {
        const msg = `User with ID ${userId} added role with ID ${roleId} to user with ID ${principalId}. Error occurred looking up IDs: ${err.message}`;
        logger.info({model, user: userId, hook: 'after save', target: principalId}, msg);
      }
    } else {
      try {
        const userPromise = User.findOne({ where: {id: principalId} });
        const rolePromise = Role.findOne({ where: {id: roleId} });
        const [user, role] = await Promise.all([userPromise, rolePromise]);
        const msg = `Automatically added role ${role.name} to ${user.username}`;
        logger.info({model, user: 'SYSTEM', hook: 'after save', target: user.username}, msg);
      } catch (err) {
        const msg = `Automatically added role with ID ${roleId} to user with ID ${principalId}. Error occured looking up IDs: ${err.message}`;
        logger.info({model, user: 'SYSTEM', hook: 'after save', target: principalId}, msg);
      }
    }

    return Promise.resolve();
  });

  RoleMapping.observe('before delete', async (ctx) => {
    const model = ctx.Model.modelName;
    const userId = ctx.options.accessToken.userId;
    const principalId = ctx.where.principalId;
    const roleId = ctx.where.roleId;

    try {
      const usersPromise = User.find({ where: {or: [{id: userId}, {id: principalId}]} });
      const rolePromise = Role.findOne({ where: {id: roleId} });
      const [users, role] = await Promise.all([usersPromise, rolePromise]);
      const user = users.find(u => u.id.toString() === userId.toString());
      const principal = users.find(u => u.id.toString() === principalId.toString());
      const msg = `${user.username} removed role ${role.name} from ${principal.username}`;
      logger.info({model, user: user.username, hook: 'before delete', target: principal.username}, msg);
    } catch (err) {
      const msg = `User with ID ${userId} removed role with ID ${roleId} from user with ID ${principalId}. Error occured looking up IDs: ${err.message}`;
      logger.info({model, user: userId, hook: 'before delete', target: principalId}, msg);
    }

    return Promise.resolve();
  });
};
