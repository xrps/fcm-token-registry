const test = require('ava');

const createRegistry = require('./registry');
const createInMemoryEntryStorage = require('./adapters/in-memory-entry-storage');
const { EntryValidationError, GroupIdValidationError } = require('./errors');

test('allows retrieving all entries', (t) => {
  const expectedEntries = [
    { token: 'a', belongsTo: 'someone' },
    { token: 'b', belongsTo: 'someone' },
    { token: 'c', belongsTo: 'someone-else' },
    { token: 'd', belongsTo: 'yet-someone-else' },
  ];
  const entryStorage = {
    getAllEntries: () => Promise.resolve(expectedEntries),
  };
  const registry = createRegistry({ entryStorage });

  return registry.getAllEntries().then((entries) => {
    t.deepEqual(entries, expectedEntries);
  });
});

test('allows retrieving all entries for a group id', (t) => {
  const groupId = 'someone';
  const entries = [
    { token: 'a', belongsTo: groupId },
    { token: 'b', belongsTo: groupId },
    { token: 'c', belongsTo: groupId },
    { token: 'd', belongsTo: 'someone-else' },
  ];
  const entryStorage = createInMemoryEntryStorage({ entries });
  const registry = createRegistry({ entryStorage });

  return registry.getEntriesByGroupId(groupId).then((_entries) => {
    t.is(_entries.length, 3);
    t.true(_entries.every(({ belongsTo }) => belongsTo === groupId));
  });
});

test('allows saving a new entry for a given group id', (t) => {
  const entries = [];
  const entryStorage = createInMemoryEntryStorage({ entries });
  const registry = createRegistry({ entryStorage });
  const input = { token: 'a', belongsTo: 'someone' };

  return registry
    .saveEntry(input)
    .then(() => registry.getAllEntries())
    .then((_entries) => {
      t.is(_entries.length, 1);
      t.is(_entries[0].token, 'a');
      t.is(_entries[0].belongsTo, 'someone');
    });
});

test('validates group id when looking for entries for that group id', (t) => {
  const groupIdTooLong = 'a'.repeat(201);
  const entryStorage = { getEntriesByGroupId: () => Promise.resolve([]) };
  const registry = createRegistry({ entryStorage });

  return t.throws(() => registry.getEntriesByGroupId(groupIdTooLong), {
    name: GroupIdValidationError.name,
  });
});

test('validates entry when saving a new entry', (t) => {
  const groupIdTooLong = 'a'.repeat(201);
  const tokenTooLong = 'a'.repeat(1025);
  const entryStorage = { saveEntry: () => Promise.resolve({}) };
  const registry = createRegistry({ entryStorage });

  return Promise.all([
    t.throws(() => registry.saveEntry({ token: tokenTooLong, belongsTo: 'someone' }), {
      name: EntryValidationError.name,
      message: /"token" length must be less than or equal to 1024 characters long/gi,
    }),
    t.throws(() => registry.saveEntry({ token: 'a', belongsTo: groupIdTooLong }), {
      name: EntryValidationError.name,
      message: /"belongsTo" length must be less than or equal to 200 characters long/gi,
    }),
  ]);
});

test('strips unknown fields in entries', (t) => {
  const expectedKeys = ['token', 'belongsTo'];
  const entries = [{ token: 'a', belongsTo: 'someone', someFunky: 'property' }];
  const entryStorage = {
    getAllEntries: () => Promise.resolve(entries),
    getEntriesByGroupId: () => Promise.resolve(entries),
    saveEntry: () => Promise.resolve(entries[0]),
    exists: () => Promise.resolve(false),
  };
  const registry = createRegistry({ entryStorage });
  const checkMatchesExpectedKeys = e => t.deepEqual(Object.keys(e), expectedKeys);
  const checkEveryEntryMatchesExpectedKeys = es => es.every(checkMatchesExpectedKeys);

  return Promise.all([
    registry.getAllEntries().then(checkEveryEntryMatchesExpectedKeys),
    registry.getEntriesByGroupId('someone').then(checkEveryEntryMatchesExpectedKeys),
    registry.saveEntry({ token: 'b', belongsTo: 'someone' }).then(checkMatchesExpectedKeys),
  ]);
});

test('ignores operation if token is already register for the given group id', (t) => {
  const entries = [{ token: 'a', belongsTo: 'someone' }];
  const entryStorage = createInMemoryEntryStorage({ entries });
  const registry = createRegistry({ entryStorage });

  return registry
    .saveEntry({ token: 'a', belongsTo: 'someone' })
    .then(() => registry.getAllEntries())
    .then(_entries => t.is(_entries.length, 1));
});
