const Promise = require('bluebird');

const DEFAULT_KEY_DELIMITER = ':$';

const createRedisStorage = ({ client }) => {
  const rPush = Promise.promisify(client.rpush.bind(client));
  const lRange = Promise.promisify(client.lrange.bind(client));
  const scan = Promise.promisify(client.scan.bind(client));
  const dbSize = Promise.promisify(client.dbsize.bind(client));
  const parseTokenEntry = (e) => {
    const [belongsTo, token] = e.split(DEFAULT_KEY_DELIMITER);

    return {
      belongsTo,
      token,
    };
  };

  return {
    getAllEntries() {
      return dbSize()
        .then(keyCount => scan(0, 'COUNT', keyCount))
        .then(([, keys]) =>
          Promise.map(keys, k => lRange(k, 0, -1)).reduce((r, curr) => r.concat(curr), []))
        .then(list => list.map(parseTokenEntry));
    },
    getEntriesByGroupId(groupId) {
      return lRange(groupId, 0, -1).then(list => list.map(parseTokenEntry));
    },
    saveEntry({ belongsTo, token }) {
      const entry = [belongsTo, DEFAULT_KEY_DELIMITER, token].join('');

      return rPush(belongsTo, entry);
    },
  };
};

exports.createRedisStorage = createRedisStorage;
exports.DEFAULT_KEY_DELIMITER = DEFAULT_KEY_DELIMITER;
