import request from 'request';

const wakeUpTime = (process.env.BOTKIT_HEROKU_WAKEUP_TIME || '6:00')
  .split(':').map(number => parseInt(number, 10));

const sleepTime =  (process.env.BOTKIT_HEROKU_SLEEP_TIME || '22:00')
  .split(':').map(number => parseInt(number, 10));

const wakeUpOffset = (60 * wakeUpTime[0] + wakeUpTime[1]) % (60 * 24);
const awakeMinutes = (60 * (sleepTime[0] + 24) + sleepTime[1] - wakeUpOffset) % (60 * 24);

const keepaliveUrl = (() => {
const url = process.env.BOTKIT_HEROKU_KEEPALIVE_URL || process.env.HEROKU_URL;

if (url && !url.match(/\/$/)) {
  return `${keepaliveUrl}/`;
}

return url;
})();

const keepaliveInterval = (() => {
if (typeof process.env.BOTKIT_HEROKU_KEEPALIVE_INTERVAL !== 'undefined') {
  return parseFloat(process.env.BOTKIT_HEROKU_KEEPALIVE_INTERVAL);
}

// Default interval
return 5;
})();

export default class HerokuKeepalive {
  constructor(controller) {
    controller.webserver.get('/heroku/keepalive', (req, res) => {
      res.set('Content-Type', 'text/plain');
      return res.send('OK');
    });

    this.logger = controller.log;
    this.keepaliveIntervalId = null;
  }

  start() {
    if (typeof keepaliveUrl === 'undefined') {
      this.logger.error(
        'botkit-heroku-keepalive included, but missing BOTKIT_HEROKU_KEEPALIVE_URL.'
      );
      return;
    }

    if (keepaliveInterval <= 0.0) {
      this.logger.error(`botkit-heroku-keepalive is ${keepaliveInterval}, so not keeping alive`);
      return;
    }

    if (this.keepaliveIntervalId) {
      this.logger.error('botkit-heroku-keepalive is already running');
      return;
    }

    this.keepaliveIntervalId = setInterval(() => {
      this.logger.info('keepalive ping');

      const now = new Date();

      const elapsedMinutes =
        (60 * (now.getHours() + 24) + now.getMinutes() - wakeUpOffset) % (60 * 24);

      if (elapsedMinutes < awakeMinutes) {
        request(`${keepaliveUrl}heroku/keepalive`, (err, res, body) => {
          if (!err) {
            this.logger.info(`keepalive pong: ${res.statusCode} ${body}`);
          } else {
            this.logger.info(`keepalive pong: ${err}`);
          }
        });
      } else {
        this.logger.info('Skipping keep alive, time to rest');
      }
    }, keepaliveInterval * 60 * 1000);
  }

  stop() {
    if (!this.keepaliveIntervalId) {
      this.logger.error('botkit-heroku-keepalive is not running');
      return;
    }

    clearInterval(this.keepaliveIntervalId);
    this.keepaliveIntervalId = null;
  }

  status() {
    if (this.keepaliveIntervalId) {
      this.logger.info('botkit-heroku-keepalive is running');
    } else {
      this.logger.info('botkit-heroku-keepalive is not running');
    }
  }
}
