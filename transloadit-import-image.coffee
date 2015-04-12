TransloaditClient = require('transloadit')
Promise = require "bluebird"
mongo = require "mongojs"
path = require "path"

transloadit = null
_templateId = null
imageSize = Promise.promisifyAll sizeOf : require "image-size"  
request = Promise.promisifyAll require("request").defaults(encoding: null)

exports.ini = (config) ->
  transloadit =  Promise.promisifyAll new TransloaditClient
    authKey    : config.TRANSLOADIT_KEY
    authSecret : config.TRANSLOADIT_SECRET
  _templateId = config.TRANSLOADIT_TEMPLATE_ID

exports.importImg = (src, key) ->
  if !transloadit then return Promise.reject(new Error "Not initialized")
  if !src then return Promise.resolve()
  buck = "rb-" + key
  name = buck + "-" + mongo.ObjectId().toString()
  prms = 
    params : 
      template_id : _templateId
    fields : 
      href : src
      name : name        
      bucket : buck

  request.getAsync(src)             
  .then (resp) ->      
    if resp[1]
      try  
        return imageSize.sizeOf(resp[1])
      catch ex
        console.log "tt-import-image.coffee:18 >>>", ex
    width : 500, height : 500        
  .then (size) ->
    prms.fields.name += "-#{size.width}x#{size.height}#{path.extname(src)}"
    transloadit.createAssemblyAsync(prms).then (res) ->
      key : key
      src : "http://#{buck}.s3.amazonaws.com/thumbnail-" + prms.fields.name
      imported_src : src
