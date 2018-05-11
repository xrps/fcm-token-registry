const test = require('ava');
const isExpressApp = require('is-express-app');
const supertest = require('supertest');
const httpStatus = require('http-status');
const pathToRegExp = require('path-to-regexp');

const createRegistry = require('./lib/registry');
const { factory: createWebService, routes } = require('./');
const createInMemoryEntryStorage = require('./lib/adapters/in-memory-entry-storage');
const { EntryValidationError } = require('./lib/errors');

const isFunction = fn => typeof fn === 'function';

test('returns an express app factory', (t) => {
  t.true(isFunction(createWebService));
  t.true(isExpressApp(createWebService({ registry: {} })));
});

test('allows retrieving all entries', (t) => {
  const expectedEntries = [
    { belongsTo: 'cecilia@xrps.co', token: 'foobarbazqnx' },
    { belongsTo: 'angelica@xrps.co', token: 'qux123456' },
  ];
  const entryStorage = createInMemoryEntryStorage({ entries: expectedEntries });
  const registry = createRegistry({ entryStorage });

  return supertest(createWebService({ registry }))
    .get(routes.ENTRIES)
    .expect(httpStatus.OK)
    .then((response) => {
      t.deepEqual(response.body, expectedEntries);
    });
});

test('allows retrieving all entries by a given group id', (t) => {
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
  const registry = createRegistry({ entryStorage });
  const urlForEntriesOfUser = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: 'a@aaa.org',
  });

  return supertest(createWebService({ registry }))
    .get(urlForEntriesOfUser)
    .expect(httpStatus.OK)
    .then((response) => {
      t.deepEqual(response.body, expectedEntries);
    });
});

test('allows registering a new entry to a given group id', (t) => {
  const requestBody = { token: 'asdf1234token' };
  const entryStorage = createInMemoryEntryStorage();
  const registry = createRegistry({ entryStorage });
  const expectedGroupId = 'someone';
  const urlForEntriesOfUser = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: expectedGroupId,
  });

  return supertest(createWebService({ registry }))
    .post(urlForEntriesOfUser)
    .send(requestBody)
    .expect(httpStatus.OK)
    .then(() => registry.getEntriesByGroupId(expectedGroupId))
    .then((entries) => {
      t.is(entries.length, 1);

      const newEntry = entries[0];

      t.is(newEntry.belongsTo, 'someone');
      t.is(newEntry.token, requestBody.token);
    });
});

test('returns an error when registering an invalid new entry', (t) => {
  const entryStorage = createInMemoryEntryStorage();
  const registry = createRegistry({ entryStorage });
  const agent = supertest(createWebService({ registry }));
  const urlForEntriesOfUser = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: 'my-group-id',
  });
  const assertions = [
    {}, // missing token
    { token: 'a'.repeat(1025) }, // token too long
  ].map(invalidRequestBody =>
    agent
      .post(urlForEntriesOfUser)
      .send(invalidRequestBody)
      .expect(httpStatus.UNPROCESSABLE_ENTITY)
      .then((response) => {
        t.is(response.body.name, EntryValidationError.name);
      }));

  return Promise.all(assertions);
});

test('ignores operation if token is already registered by the same group id', (t) => {
  const entryStorage = createInMemoryEntryStorage();
  const registry = createRegistry({ entryStorage });
  const agent = supertest(createWebService({ registry }));
  const url = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: 'someone',
  });

  return registry.saveEntry({ token: 'asdf1234token', belongsTo: 'someone' }).then(() =>
    agent
      .post(url)
      .send({ token: 'asdf1234token' })
      .expect(httpStatus.OK)
      .then(() => registry.getEntriesByGroupId('someone'))
      .then((entries) => {
        t.is(entries.length, 1);
        t.is(entries[0].token, 'asdf1234token');
      }));
});

test.todo('forwards an error to next handler if unable to handle it');
