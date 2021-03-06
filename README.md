# botkit-heroku-keepalive

[![Greenkeeper badge](https://badges.greenkeeper.io/ponko2/botkit-heroku-keepalive.svg)](https://greenkeeper.io/)
[![npm version](https://badge.fury.io/js/%40ponko2%2Fbotkit-heroku-keepalive.svg)](https://badge.fury.io/js/%40ponko2%2Fbotkit-heroku-keepalive)
[![Build Status](https://travis-ci.org/ponko2/botkit-heroku-keepalive.svg?branch=master)](https://travis-ci.org/ponko2/botkit-heroku-keepalive)

# Installation

```sh
npm install @ponko2/botkit-heroku-keepalive --save
```

# Configuring

```sh
$ heroku config:set BOTKIT_HEROKU_KEEPALIVE_URL=$(heroku apps:info -s | grep web-url | cut -d= -f2)
$ heroku config:set BOTKIT_HEROKU_KEEPALIVE_INTERVAL=5
$ heroku config:set BOTKIT_HEROKU_WAKEUP_TIME=6:00
$ heroku config:set BOTKIT_HEROKU_SLEEP_TIME=22:00
$ heroku config:set TZ='Asia/Tokyo'
```

```sh
$ heroku addons:create scheduler:standard
$ heroku addons:open scheduler
```

```sh
$ curl ${BOTKIT_HEROKU_KEEPALIVE_URL}heroku/keepalive
```

## Usage

```js
var Botkit          = require('botkit');
var HerokuKeepalive = require('@ponko2/botkit-heroku-keepalive');

var controller = Botkit.slackbot({
  debug: false
});

var herokuKeepalive;

controller.setupWebserver(process.env.PORT || 8080, function (err, webserver) {
  herokuKeepalive = new HerokuKeepalive(controller);
});

controller.spawn({
  token: process.env.BOTKIT_SLACK_TOKEN
}).startRTM(function (err) {
  if (err) {
    throw new Error(err);
  }

  herokuKeepalive.start();
});
```
