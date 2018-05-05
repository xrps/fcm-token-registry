const test = require('ava');

const { EntryValidationError } = require('./errors');
const { createEntryDto } = require('./dtos');

test('validates required entry fields are present', (t) => {
  t.throws(createEntryDto, { name: EntryValidationError.name, message: /"value" is required/gi });
  t.throws(() => createEntryDto({ token: 'asdf1234' }), {
    name: EntryValidationError.name,
    message: /"belongsTo" is required/gi,
  });
  t.throws(() => createEntryDto({ belongsTo: 'asdf1234' }), {
    name: EntryValidationError.name,
    message: /"token" is required/gi,
  });
});

test('validates entry fields are within acceptable length', (t) => {
  const tokenTooLongInput = { belongsTo: 'user@somewhere.org', token: 'a'.repeat(1025) };

  t.throws(() => createEntryDto(tokenTooLongInput), {
    name: EntryValidationError.name,
    message: /"token" length must be less than or equal to/gi,
  });

  const groupIdTooLong = { token: 'abc1235mytoken', belongsTo: 'a'.repeat(201) };

  t.throws(() => createEntryDto(groupIdTooLong), {
    name: EntryValidationError.name,
    message: /"belongsTo" length must be less than or equal to/gi,
  });
});
