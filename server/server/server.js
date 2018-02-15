'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');

    console.log( "BACKEND INIT - ENV mode: ", process.env.NODE_ENV );
    console.log( "BACKEND INIT - ENV DEBUG_LEVEL SET", process.env.DEBUG_LEVEL );
    if (process.env.NODE_ENV == "dev" && process.env.DEBUG_LEVEL == 6 ) {
      console.log("BACKEND INIT - ENV:");
      console.log(process.env);
    }

    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('BACKEND INIT - web server listening at: %s', baseUrl);

    //if dev mode, init loopback REST API GUI
    if (process.env.NODE_ENV == "dev" && app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('BACKEND INIT - loopback component explorer REST API at %s%s', baseUrl, explorerPath);
    }
  });
};
