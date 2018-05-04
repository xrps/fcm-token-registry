const joi = require('joi');
const VError = require('verror');

const { EntryValidationError } = require('./errors');

const entrySchema = joi.object().keys({
  belongsTo: joi
    .string()
    .email()
    .max(200)
    .required()
    .trim(),
  token: joi
    .string()
    .max(1024)
    .required()
    .trim(),
});

exports.createEntryDto = (input) => {
  const { error, value } = joi.validate(input, entrySchema, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new VError(
      {
        name: EntryValidationError.name,
        cause: error,
        info: { failedValidations: error.details },
      },
      EntryValidationError.message
    );
  }

  return value;
};
