loggly = require 'loggly'
Promise = require "bluebird"
client = null

exports.init = (dir, LOGGLY_KEY, tags) ->
  pack = require(dir + "/package")
  tags ?= []
  tags = ["ride-better", pack.name, pack.ver].concat(tags).filter (f) -> f
  client = Promise.promisifyAll loggly.createClient
    token: LOGGLY_KEY
    subdomain: "baio"
    tags: tags
    json:true

exports.write = (msg) ->
  if !client then return Promise.reject new Error "Not initialized"
  console.log msg
  client.logAsync msg
