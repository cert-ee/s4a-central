const loopback = require('loopback');
const passport = require('passport');

const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "passport"});

module.exports = function (app) {
  app.use(passport.initialize());

  app.use((req, res, next) => {

    /*
    AUTH CHECKS
     */
    if (process.env.NODE_ENV != "dev") hell.o("start", "login", "info");

    //Token auth
    let header_token = "";
    if (req.headers['x-access-token']) {
      header_token = req.headers['x-access-token'];
    }

    //Internal auth
    if (!req.headers['x-remote-user']) {
      if (process.env.NODE_ENV != "dev") hell.o([header_token, "auth ok"], "login", "info");
      return next();
    }

    let remote_user = req.headers['x-remote-user'];
    if (process.env.NODE_ENV != "dev") hell.o(remote_user, "login", "info");


    let User = app.models.User;
    let AccessToken = app.models.AccessToken;

    (async function () {
      try {

        let user = await User.findOrCreate({where: {username: remote_user}}, {username: remote_user});
        if (!user) throw new Error("Failed to find/create user :" + remote_user);
        user = user[0];

        let token = await AccessToken.findOne({where: {userId: user.id}});
        if (!token) {
          hell.o([remote_user, "no access token, create"], "login", "warn");
          token = await user.createAccessToken(-1);
        }

        if (!token) throw new Error("Failed to create access token for user: " + remote_user);

        req.logIn(user, {session: false}, (err) => {
          if (err) return next(err);
          req.accessToken = token;
          // console.log( token );
          if (process.env.NODE_ENV != "dev") hell.o([remote_user, "auth ok"], "login", "info");
          return next();
        });

      } catch (err) {
        hell.o([remote_user, "failed"], "login", "error");
        hell.o(err, "login", "error");

        return next(err);
      }

    })();

  }); //app.use

  app.use(
    loopback.token(
      {
        model: app.models.accessToken,
        currentUserLiteral: 'current',
        headers: ['access-token', 'X-Access-Token', 'X-API-Key'],
        params: ['access-token', 'access_token']
      })
  );

};
