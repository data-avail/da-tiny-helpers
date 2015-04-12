Promise = require "bluebird"
mongo = require "mongojs"

_db = null 

#mongo(config.MONGO_URI, ["ths", "resorts"])  
#exports.ths = Promise.promisifyAll db.ths
#exports.resorts =  Promise.promisifyAll db.resorts

exports.ObjectId = mongo.ObjectId

exports.ini = (uri, colls) ->
  if _db 
    throw new Error "Already initialized"
  else
    _db = mongo(uri, colls)
    for coll in colls 
      exports[coll] = Promise.promisifyAll _db[coll]
  return _db;

close = ->    
  if !_db 
    throw new Error "Not initialized yet"
  else
    _db.close()
    _db = null

exports.read = (coll, next, query, sort, limit) ->  

  if !_db
    return Promise.reject new Error "Not initialized yet"

  _end = false 
  _readOne = false

  deferred = Promise.defer()

  cursor = _db[coll].find(query)

  if sort
    cursor = cursor.sort(sort)

  if limit
    cursor = cursor.limit(limit)

  cursor.on "data", (data) ->
    _readOne = true
    cursor.pause()
    next(data).then ->
      if _end
        close()
        deferred.resolve()
      else
        cursor.resume()
    , (err) ->
      cursor.emit "error", err

  cursor.on "error", (err) ->
    close()
    deferred.reject(err)

  cursor.on "end", (data) ->
    # TO DO : error when zero results
    _end = true
    if !_readOne
      close()
      deferred.resolve()

  deferred.promise

exports.updOrCreate = (coll, query, upd, doc) ->  

  if !_db
    return Promise.reject new Error "Not initialized yet"

  exports[coll].updateAsync(query, upd)
  .then (res) ->
    if res.n == 0
      exports[coll].insertAsync(doc)
    else
      res
