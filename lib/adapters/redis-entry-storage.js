/**
 * @module adapters/redis-entry-storage
 */
const Promise = require('bluebird');

/**
 * Delimeter to be used when serializing entries to be saved in a redis list.
 * @type {String}
 */
const DEFAULT_KEY_DELIMITER = ':$';

/**
 * Allows saving and retrieving entries from Redis.
 * @param  {Object}  context
 * @param  {redis.Client} context.client
 * @return {Storage}
 */
const createRedisStorage = ({ client }) => {
  const rPush = Promise.promisify(client.rpush.bind(client));
  const lRange = Promise.promisify(client.lrange.bind(client));
  const scan = Promise.promisify(client.scan.bind(client));
  const dbSize = Promise.promisify(client.dbsize.bind(client));
  const exists = Promise.promisify(client.exists.bind(client));
  const parseTokenEntry = (e) => {
    const [belongsTo, token] = e.split(DEFAULT_KEY_DELIMITER);

    return {
      belongsTo,
      token,
    };
  };

  return {
    /**
     * @return {Promise<Entry[]>}
     */
    getAllEntries() {
      return dbSize()
        .then(keyCount => scan(0, 'COUNT', keyCount))
        .then(([, keys]) =>
          Promise.map(keys, k => lRange(k, 0, -1)).reduce((r, curr) => r.concat(curr), []))
        .then(list => list.map(parseTokenEntry));
    },
    /**
     * @param  {String} groupId
     * @return {Promise<Entry[]>}
     */
    getEntriesByGroupId(groupId) {
      return lRange(groupId, 0, -1).then(list => list.map(parseTokenEntry));
    },
    /**
     * @param  {Entry} input
     * @return {Promise<Entry>}
     */
    saveEntry({ belongsTo, token }) {
      const entry = [belongsTo, DEFAULT_KEY_DELIMITER, token].join('');

      return rPush(belongsTo, entry);
    },
    /**
     * @param  {Entry} entry
     * @return {Promise<Boolean>}
     */
    exists({ belongsTo, token }) {
      return exists(belongsTo)
        .then(e => (e ? lRange(belongsTo, 0, -1) : []))
        .then(list => list.map(parseTokenEntry))
        .then(list => list.some(e => e.token === token));
    },
  };
};

exports.createRedisStorage = createRedisStorage;
exports.DEFAULT_KEY_DELIMITER = DEFAULT_KEY_DELIMITER;
