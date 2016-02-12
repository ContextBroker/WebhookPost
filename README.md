# WebhookPost
A webhook for your application

[![Build Status](https://travis-ci.org/piranna/WebhookPost.svg?branch=master)](https://travis-ci.org/piranna/WebhookPost)
[![Coverage Status](https://coveralls.io/repos/github/piranna/WebhookPost/badge.svg?branch=master)](https://coveralls.io/github/piranna/WebhookPost?branch=master)

[![npm](https://nodei.co/npm/webhook-post.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/webhook-post)
[![npm-dl](https://nodei.co/npm-dl/webhook-post.png?height=2)](https://www.npmjs.com/package/webhook-post)

Add easily a webhook to your application both on Node.js and browser as an
stream of objects. It can be able to use a remote *ServerSent Events* server or
enable an ad-hoc local web server, both directly or by using a proxy like
[post2sse](https://github.com/piranna/post2sse) or
[browserver](https://github.com/jed/browserver-client).

## Install

```sh
npm install --save webhook-post
```

## Usage

`WebhookPost` is a Node.js [stream](https://nodejs.org/api/stream.html)
[Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable)
object. It accept as argument the remote SSE server url as a `string`, the
local ad-hoc web server port as a `Ǹumber`, or an object with the local ad-hoc
web server `hostname` and `port`.

To stop listening for notifications and emitting them on `data` events, just
call the `.close()` method.
