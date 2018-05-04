const test = require('ava');
const isExpressApp = require('is-express-app');
const supertest = require('supertest');
const httpStatus = require('http-status');
const pathToRegExp = require('path-to-regexp');

const { factory: createTokenRegistry, routes } = require('./');
const createInMemoryEntryStorage = require('./lib/adapters/in-memory-entry-storage');

const isFunction = fn => typeof fn === 'function';

test('returns an express app factory', (t) => {
  t.true(isFunction(createTokenRegistry));
  t.true(isExpressApp(createTokenRegistry({ entryStorage: {} })));
});

test('allows retrieving all entries', async (t) => {
  const expectedEntries = [
    { belongsTo: 'cecilia@xrps.co', token: 'foobarbazqnx' },
    { belongsTo: 'angelica@xrps.co', token: 'qux123456' },
  ];
  const entryStorage = createInMemoryEntryStorage({ entries: expectedEntries });
  await supertest(createTokenRegistry({ entryStorage }))
    .get(routes.ENTRIES)
    .expect(httpStatus.OK)
    .then((response) => {
      t.deepEqual(response.body, expectedEntries);
    });
});

test('allows retrieving all entries by a given group id', async (t) => {
  const entries = [
    { belongsTo: 'a@aaa.org', token: 'aaaaa' },
    { belongsTo: 'a@aaa.org', token: 'ahaha' },
    { belongsTo: 'b@bbb.org', token: 'bbbbb' },
  ];
  const expectedEntries = [
    { belongsTo: 'a@aaa.org', token: 'aaaaa' },
    { belongsTo: 'a@aaa.org', token: 'ahaha' },
  ];
  const entryStorage = createInMemoryEntryStorage({ entries });
  const urlForEntriesOfUser = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: 'a@aaa.org',
  });
  await supertest(createTokenRegistry({ entryStorage }))
    .get(urlForEntriesOfUser)
    .expect(httpStatus.OK)
    .then((response) => {
      t.deepEqual(response.body, expectedEntries);
    });
});

test.todo('allows registering a new entry to a given group id');
