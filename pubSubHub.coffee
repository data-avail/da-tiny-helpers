rabbit = require('rabbit.js')
extend = require('util')._extend
Promise = require "bluebird"


class PubSubHub 

  @opts =
    uri: undefined #reuired
    queue: undefined  #reuired
    type: "PUB" #PUB|SUB|PUSH|PULL
    onSub: undefined

  connect: (_opts) ->
    
    opts = extend {}, PubSubHub.opts
    opts = extend opts, _opts          

    if !_opts.uri
      throw new Error "opts.uri must be defined"

    if !_opts.queue
      throw new Error "opts.queue must be defined"
    
    context = rabbit.createContext(opts.uri)

    deferred = Promise.defer()

    context.on 'error', (err) ->
      deferred.reject err

    context.on 'ready', =>

      socket = context.socket(opts.type)

      socket.connect opts.queue, (res) =>

        if (res?.status == "error")
          deferred.reject res

        @context = context
        @socket = socket

        if opts.onSub
          @socket.setEncoding "utf8"
          @socket.on "data", (data) ->
            try
              json = JSON.parse data
              opts.onSub json
            catch
              console.log "Failed to parse data", data
      
        deferred.resolve()      

    deferred.promise

  pub: (obj) ->

    if !@socket
      throw new Error "Not connected"

    @socket.write JSON.stringify(obj), "utf8"


  close: ->

    if !@socket
      console.log "close failed, not connected"
      return
    
    @socket.close()
    @context.close()
    @socket = null
    @context = null


module.exports = PubSubHub



