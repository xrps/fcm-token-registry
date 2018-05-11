const assert = require('assert');

const isMain = require('is-main');
const mongodb = require('mongodb');

const { factory: createMongoDbStorage } = require('../adapters/mongodb-entry-storage');
const { factory: createApi } = require('../..');

const start = () => {
  assert('DB_URI' in process.env, 'DB_URI env var missing');
  assert('DB_NAME' in process.env, 'DB_NAME env var missing');

  return mongodb.MongoClient.connect(process.env.DB_URI).then((client) => {
    const db = client.db(process.env.DB_NAME);
    const entryStorage = createMongoDbStorage({ db });
    const api = createApi({ entryStorage });

    api.listen(process.env.NODE_PORT || 3000);
  });
};

module.exports = start;

if (isMain(module)) {
  start();
}
