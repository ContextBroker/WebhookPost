#!/usr/bin/env node

var get = require('http').get

var WebhookPost = require('./index')


// Create the WebhookPost instance
var webhook = WebhookPost()
.on('error', function(error)
{
  console.trace('webhook errored:',error)
})

// Subscribe to the `data` and `end` events. You can use the Node.js streams API
//`.pipe()` method, too
webhook.on('data', function(data)
{
  console.log('webhook received notification "'+data+'"')
})
webhook.on('end', function()
{
  console.log('webhook ended')
})


// Send someway a GET or POST request to the webhook after it gets open
webhook.on('open', function(url)
{
  console.log('webhook listening at',url)

  get(url+'?hello world')
})

// We'll close the webhook as soon as we receive the first notification. We are
// not interested on anything more... :-)
webhook.on('data', function(data)
{
  this.close()
})
