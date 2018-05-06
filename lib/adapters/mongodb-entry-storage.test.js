const test = require('ava');
const sinon = require('sinon');
const mongodb = require('mongodb');
const MongoDbServer = require('mongodb-memory-server').default;
const uuid = require('uuid');

const isCI = process.env.NODE_ENV === 'ci';

const {
  factory: createMongoDbEntryStorage,
  DEFAULT_COLLECTION_NAME,
} = require('./mongodb-entry-storage');

test.before((t) => {
  const dbServerMock = { start() {}, stop() {}, getPort: () => Promise.resolve(27017) };
  const dbServer = isCI ? dbServerMock : new MongoDbServer();

  return dbServer.getPort().then((_dbPort) => {
    const dbHost = isCI ? process.env.CI_DB_HOST : 'localhost';
    const dbPort = isCI ? parseInt(process.env.CI_DB_PORT, 10) : _dbPort;

    Object.assign(t.context, { dbHost, dbPort, dbServer });
  });
});

test.beforeEach((t) => {
  const { dbHost, dbPort } = t.context;
  const dbName = uuid.v4();
  const dbUri = `mongodb://${dbHost}:${dbPort}/${dbName}`;

  return mongodb.MongoClient.connect(dbUri)
    .then(dbClient => dbClient.db(dbName))
    .then(db => Object.assign(t.context, { db }));
});

test.afterEach(t => t.context.db.dropDatabase());

test.after(t => t.context.dbServer.stop());

test('assumes a default collection name if none is provided', (t) => {
  const dbMock = { collection: sinon.spy() };

  createMongoDbEntryStorage({ db: dbMock });

  t.true(dbMock.collection.calledWith(DEFAULT_COLLECTION_NAME));
});

test('allows retrieving entries from a mongodb collection', (t) => {
  const storage = createMongoDbEntryStorage({ db: t.context.db });
  const collection = t.context.db.collection(DEFAULT_COLLECTION_NAME);

  return collection
    .insertMany([
      { token: 'a', belongsTo: 'someone' },
      { token: 'b', belongsTo: 'someone' },
      { token: 'c', belongsTo: 'someone' },
    ])
    .then(() => storage.getAllEntries())
    .then((entries) => {
      t.is(entries.length, 3);
      t.true(entries.every(e => e.belongsTo === 'someone'));
    });
});

test('allows retrieving entries from a mongodb collection filtering them by group id', (t) => {
  const storage = createMongoDbEntryStorage({ db: t.context.db });
  const collection = t.context.db.collection(DEFAULT_COLLECTION_NAME);
  return collection
    .insertMany([
      { token: 'a', belongsTo: 'someone' },
      { token: 'b', belongsTo: 'someone' },
      { token: 'c', belongsTo: 'someone' },
      { token: 'd', belongsTo: 'someone-else' },
    ])
    .then(() => storage.getEntriesByGroupId('someone-else'))
    .then((entries) => {
      t.is(entries.length, 1);

      const { token, belongsTo: owner } = entries[0];

      t.is(token, 'd');
      t.is(owner, 'someone-else');
    });
});

test('allows saving new entries into a mongodb collection', (t) => {
  const storage = createMongoDbEntryStorage({ db: t.context.db });
  const collection = t.context.db.collection(DEFAULT_COLLECTION_NAME);

  return collection
    .count()
    .then(count => t.is(count, 0))
    .then(() => storage.saveEntry({ token: 'asdf1234token', belongsTo: 'someone' }))
    .then(() => collection.findOne())
    .then(({ token, belongsTo: owner }) => {
      t.is(token, 'asdf1234token');
      t.is(owner, 'someone');
    });
});
