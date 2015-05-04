var Promise, client, loggly;

loggly = require('loggly');

Promise = require("bluebird");

client = null;

exports.init = function(dir, LOGGLY_KEY, tags) {
  var pack;
  pack = require(dir + "/package");
  if (tags == null) {
    tags = [];
  }
  tags = ["ride-better", pack.name, pack.ver].concat(tags).filter(function(f) {
    return f;
  });
  return client = Promise.promisifyAll(loggly.createClient({
    token: LOGGLY_KEY,
    subdomain: "baio",
    tags: tags,
    json: true
  }));
};

exports.write = function(msg) {
  if (!client) {
    return Promise.reject(new Error("Not initialized"));
  }
  console.log(msg);
  return client.logAsync(msg);
};
