var nconf = require('nconf');
var pg = require('pg');
var readFile = require('fs').readFile;
var url = require('url');

function parseUri (uri) {
  var u = url.parse(uri, true);
  var userPass = u.auth ? u.auth.split(':') : [];
  u.user = userPass[0];
  u.password = userPass[1];
  u.database = u.pathname.split('/').join('');
  u.host = u.hostname;
  u.ssl = true;
  return u;
}


module.exports = function(filename, userParams, cb) {
  var client = new pg.Client(parseUri(nconf.get('POSTGRES_URL')));

  client.connect(function(e) {
    if(e) return handleError(e);

    readFile('sql/' + filename + '.sql', function(e, data) {
      if(e) return handleError(e);

      client.query(data.toString(), userParams || [], function(e, result) {
        if(e) return handleError(e);
        client.end();

        cb(null, result);
      });
    });
  });

  function handleError(e) {
    client.end();
    return cb(e);
  }
};
