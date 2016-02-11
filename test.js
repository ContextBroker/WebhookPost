var assert = require('assert')
var http   = require('http')
var parse  = require('url').parse

var post2sse = require('post2sse')

var WebhookPost = require('./index')


var webhook


afterEach(function()
{
  webhook.close()
})


describe('Remote ServerSendEvent server', function()
{
  var proxy, proxyPort

  beforeEach(function(done)
  {
    proxy = http.createServer(post2sse()).listen(0, function()
    {
      proxyPort = this.address().port
      done()
    })
  })

  afterEach(function()
  {
    proxy.close()
  })


  it('Remote proxy', function(done)
  {
    var expected = 'asdf'

    var proxyUrl = 'http://localhost:'+proxyPort+'/<ID>'

    webhook = WebhookPost(proxyUrl)
    .on('open', function(url)
    {
      assert.strictEqual(url, proxyUrl)

      var requestOptions = parse(url)
          requestOptions.method = 'POST'

      http.request(requestOptions).end(expected)
    })
    .on('data', function(data)
    {
      assert.strictEqual(data, expected)

      this.close()
    })
    .on('end', done)
  })
})

describe('Ad-hoc local web server', function()
{
  it('Local server on random port', function(done)
  {
    var expected = 'asdf'

    webhook = WebhookPost()
    .on('open', function(url)
    {
      var requestOptions = parse(url)
          requestOptions.method = 'POST'

      http.request(requestOptions).end(expected)
    })
    .on('data', function(data)
    {
      assert.strictEqual(data, expected)

      this.close()
    })
    .on('end', done)
  })
})
