var http              = require('http')
var networkInterfaces = require('os').networkInterfaces
var parse             = require('url').parse
var Readable          = require('stream').Readable

var concat      = require('concat-stream')
var EventSource = require('eventsource')
var inherits    = require('inherits')


const HOSTNAME = '0.0.0.0'


/**
 * Filter the external IPv4 network interfaces
 *
 * @param {Object} info
 * @param {string} [info.family]
 * @param {Bollean} [info.internal]
 *
 * @return {Boolean}
 */
function filterIPv4(info)
{
  return info.family === 'IPv4' && !info.internal
}

/**
 * Get the adfress of an external IPv4 network interface in the current system
 *
 * @return {string|undefined}
 */
function getHostname()
{
  var interfaces = networkInterfaces()
  for(var name in interfaces)
  {
    var info = interfaces[name].filter(filterIPv4)[0]
    if(info) return info.address
  }
}


/**
 * Connect to a remove SSE server to receive the webhook notifications
 *
 * @param {string} webhook
 * @param {Object} [options]
 * @param {Boolean} [options.withCredentials=false]
 *
 * @return {EventSource}
 */
function createEventSource(webhook, options)
{
  var self = this

  var eventSource = new EventSource(webhook, options)

  eventSource.addEventListener('open', this.emit.bind(this, 'open', webhook))
  eventSource.addEventListener('message', function(message)
  {
    self.push(message.data)
  })

  return eventSource
}

/**
 * Create an ad-hoc web server where to receive the webhook notifications
 *
 * @param {Object} webhook
 * @param {string} [webhook.hostname='0.0.0.0']
 * @param {Number} [webhook.port=0]
 *
 * @return {http.Server}
 */
function createServer(webhook)
{
  var self = this

  var onError = this.emit.bind(this, 'error')

  var port     = webhook.port     || 0
  var hostname = webhook.hostname || HOSTNAME

  var server = http.createServer(function(req, res)
  {
    if(req.method === 'GET')
    {
      res.end()

      return self.push(parse(req.url).query)
    }

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
  .on('error'      , onError)
  .on('clientError', onError)

  return server
}


/**
 * Create a stream of webhook notifications
 *
 * @constructor
 *
 * @param {Object|string|Number} [webhook={}]
 * @param {string} [webhook.hostname='0.0.0.0']
 * @param {Number} [webhook.port=0]
 * @param {Object} [options]
 * @param {Boolean} [options.withCredentials=false]
 *
 * @emits WebhookPost#open
 * @emits WebhookPost#data
 * @emits WebhookPost#error
 * @emits Readable#end
 */
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
    var eventSource = createEventSource.call(this, webhook, options)

    eventSource.addEventListener('error', function(error)
    {
      if(this.readyState !== EventSource.CLOSED)
        return self.emit('error', error)

      self.push(null)
      eventSource = null
    })
  }

  // Ad-hoc local web server
  else
  {
    if(webhook == null) webhook = {}
    else if(typeof webhook === 'number') webhook = {port: webhook}

    var server = createServer.call(this, webhook)
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


/**
 * Needed by {Readable} API, ignored
 *
 * @private
 */
WebhookPost.prototype._read = function(){}


/**
 * The webhook is ready and start to emit incoming notifications
 *
 * The connection to the remote SSE server has been stablished or the local
 * ad-hoc web server has started
 *
 * @event WebhookPost#open
 *
 * @type {string} - URL where to receive the notifications POST requests
 */

/**
 * @event WebhookPost#data
 *
 * @type {string}
 */

/**
 * @event WebhookPost#error
 *
 * @type {Error}
 */


module.exports = WebhookPost
