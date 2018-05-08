const ava = require('ava');
const redis = require('redis');
const RedisServer = require('redis-server');
const getPort = require('get-port');
const Promise = require('bluebird');

const { createRedisStorage, DEFAULT_KEY_DELIMITER } = require('./redis-entry-storage');

const isCI = process.env.NODE_ENV === 'ci';

Promise.promisifyAll(redis.RedisClient.prototype);

// on CI, run tests in sequence as there will be only *one* redis server.
const test = isCI ? ava.serial : ava;

test.beforeEach(t =>
  getPort().then((redisPort) => {
    const options = isCI
      ? { redisPort: parseInt(process.env.CI_REDIS_PORT, 10), redisHost: process.env.CI_REDIS_HOST }
      : {
        redisPort,
        redisHost: 'localhost',
      };
    const redisServerMock = { open: () => Promise.resolve(), close: () => Promise.resolve() };
    const redisServer = isCI
      ? redisServerMock
      : new RedisServer({
        port: options.redisPort,
        host: options.redisHost,
      });

    return redisServer.open().then(() => {
      const redisClient = redis.createClient(options.redisPort, options.redisHost);

      Object.assign(t.context, options, { redisServer, redisClient });

      return redisClient.flushallAsync();
    });
  }));

test.afterEach(t => t.context.redisServer.close());

test('allows retrieving entries from a redis server', (t) => {
  const storage = createRedisStorage({ client: t.context.redisClient });

  return Promise.all([
    t.context.redisClient.rpushAsync('someone', 'someone:$a', 'someone:$b', 'someone:$c'),
    t.context.redisClient.rpushAsync('someone-else', 'someone-else:$a'),
  ])
    .then(() => storage.getAllEntries())
    .then((entries) => {
      t.is(entries.length, 4);
      t.is(entries.filter(e => e.belongsTo === 'someone').length, 3);
      t.is(entries.filter(e => e.belongsTo === 'someone-else').length, 1);
    });
});

test('allows retrieving entries from a redis server filtering them by group id', (t) => {
  const storage = createRedisStorage({ client: t.context.redisClient });

  return t.context.redisClient
    .rpushAsync('someone', 'someone:$a', 'someone:$b')
    .then(() => t.context.redisClient.rpushAsync('someone-else', 'someone-else:$a'))
    .then(() => storage.getEntriesByGroupId('someone'))
    .then((entries) => {
      t.is(entries.length, 2);
      t.true(entries.every(e => e.belongsTo === 'someone'));
    });
});

test('allows saving entries into a redis server', (t) => {
  const storage = createRedisStorage({ client: t.context.redisClient });

  return storage
    .saveEntry({ token: 'a', belongsTo: 'someone' })
    .then(() => t.context.redisClient.lrangeAsync('someone', 0, 1))
    .then((list) => {
      t.is(list.length, 1);

      const [owner, token] = list[0].split(DEFAULT_KEY_DELIMITER);

      t.is(token, 'a');
      t.is(owner, 'someone');
    });
});
