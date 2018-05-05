const test = require('ava');
const isExpressApp = require('is-express-app');
const supertest = require('supertest');
const httpStatus = require('http-status');
const pathToRegExp = require('path-to-regexp');

const { factory: createTokenRegistry, routes } = require('./');
const createInMemoryEntryStorage = require('./lib/adapters/in-memory-entry-storage');
const { EntryValidationError } = require('./lib/errors');

const isFunction = fn => typeof fn === 'function';

test('returns an express app factory', (t) => {
  t.true(isFunction(createTokenRegistry));
  t.true(isExpressApp(createTokenRegistry({ entryStorage: {} })));
});

test('allows retrieving all entries', (t) => {
  const expectedEntries = [
    { belongsTo: 'cecilia@xrps.co', token: 'foobarbazqnx' },
    { belongsTo: 'angelica@xrps.co', token: 'qux123456' },
  ];
  const entryStorage = createInMemoryEntryStorage({ entries: expectedEntries });

  return supertest(createTokenRegistry({ entryStorage }))
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
  const urlForEntriesOfUser = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: 'a@aaa.org',
  });

  return supertest(createTokenRegistry({ entryStorage }))
    .get(urlForEntriesOfUser)
    .expect(httpStatus.OK)
    .then((response) => {
      t.deepEqual(response.body, expectedEntries);
    });
});

test('allows registering a new entry to a given group id', (t) => {
  const requestBody = { token: 'asdf1234token' };
  const entryStorage = createInMemoryEntryStorage();
  const expectedGroupId = 'someone';
  const urlForEntriesOfUser = pathToRegExp.compile(routes.ENTRIES_OF_GROUP)({
    groupId: expectedGroupId,
  });

  return supertest(createTokenRegistry({ entryStorage }))
    .post(urlForEntriesOfUser)
    .send(requestBody)
    .expect(httpStatus.OK)
    .then(() => entryStorage.getEntriesByGroupId(expectedGroupId))
    .then((entries) => {
      t.is(entries.length, 1);

      const newEntry = entries[0];

      t.is(newEntry.belongsTo, 'someone');
      t.is(newEntry.token, requestBody.token);
    });
});

test('returns an error when registering an invalid new entry', (t) => {
  const entryStorage = createInMemoryEntryStorage();
  const agent = supertest(createTokenRegistry({ entryStorage }));
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
