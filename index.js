var createServer      = require('http').createServer
var networkInterfaces = require('os').networkInterfaces
var Readable          = require('stream').Readable

var concat      = require('concat-stream')
var EventSource = require('eventsource')
var inherits    = require('inherits')


const HOSTNAME = '0.0.0.0'


function filterIPv4(interface)
{
  return interface.family === 'IPv4' && !interface.internal
}

function getHostname()
{
  var interfaces = networkInterfaces()
  for(var name in interfaces)
  {
    var interface = interfaces[name].filter(filterIPv4)[0]
    if(interface) return interface.address
  }
}


function WebhookPost(webhook, options)
{
  if(!(this instanceof WebhookPost)) return new WebhookPost(webhook, options)

  var self = this

  options = options || {}
  options.objectMode = true

  WebhookPost.super_.call(this, options)


  // Remote ServerSendEvent server
  if(typeof webhook === 'string')
  {
    var eventSource = new EventSource(webhook, options)

    eventSource.addEventListener('open', this.emit.bind(this, 'open', webhook))
    eventSource.addEventListener('error', function(error)
    {
      if(this.readyState !== EventSource.CLOSED)
        return self.emit('error', error)

      self.push(null)
      eventSource = null
    })
    eventSource.addEventListener('message', function(message)
    {
      self.push(message.data)
    })
  }

  // Local POST server
  else
  {
    if(webhook == null) webhook = {}
    else if(typeof webhook === 'number') webhook = {port: webhook}

    var port     = webhook.port     || 0
    var hostname = webhook.hostname || HOSTNAME

    var server = createServer(function(req, res)
    {
      req.pipe(concat(function(body)
      {
        res.end()

        self.push(body.toString())
      }))
    })
    .listen(port, hostname, function()
    {
      var address = this.address()

      if(hostname === HOSTNAME) hostname = getHostname()

      if(!hostname)
      {
        self.emit('error', new Error("There's no public available interfaces"))

        return this.close()
      }

      self.emit('open', 'http://'+hostname+':'+address.port)
    })
    .on('clientError', this.emit.bind(this, 'error'))
    .on('close', function()
    {
      self.push(null)
      server = null
    })
  }


  //
  // Public API
  //

  /**
   * Close the connection and stop emitting more data updates
   */
  this.close = function()
  {
    var connection = eventSource || server
    if(!connection) return

    connection.close()
  }
}
inherits(WebhookPost, Readable)


WebhookPost.prototype._read = function(){}


module.exports = WebhookPost
