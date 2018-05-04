const test = require('ava');
const isExpressApp = require('is-express-app');
const supertest = require('supertest');
const httpStatus = require('http-status');

const { factory: createTokenRegistry, routes } = require('./');

const isFunction = fn => typeof fn === 'function';

test('returns an express app factory', (t) => {
  t.true(isFunction(createTokenRegistry));
  t.true(isExpressApp(createTokenRegistry({ entryStorage: {} })));
});

test('allows retrieving all entries', async (t) => {
  const expectedEntries = [
    { owner: 'cecilia@xrps.co', token: 'foobarbazqnx' },
    { owner: 'angelica@xrps.co', token: 'qux123456' },
  ];
  const entryStorage = {
    getAllEntries: async () => expectedEntries,
    saveEntry: async () => {},
  };
  await supertest(createTokenRegistry({ entryStorage }))
    .get(routes.ENTRIES)
    .expect(httpStatus.OK)
    .then((response) => {
      t.deepEqual(response.body, expectedEntries);
    });
});

test.todo('allows retrieving all entries by a given group id');
test.todo('allows registering a new entry to a given group id');
