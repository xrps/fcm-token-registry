const joi = require('joi');
const VError = require('verror');

const { EntryValidationError, GroupIdValidationError } = require('./errors');

const matchSchemaOrThrow = ({ input, schema, error: errorType }) => {
  const { error, value } = joi.validate(input, schema, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new VError(
      {
        name: errorType.name,
        cause: error,
        info: { failedValidations: error.details },
      },
      errorType.message
    );
  }

  return value;
};

const groupIdSchema = joi
  .string()
  .max(200)
  .required()
  .trim();

const entrySchema = joi
  .object()
  .keys({
    belongsTo: groupIdSchema,
    token: joi
      .string()
      .max(1024)
      .required()
      .trim(),
  })
  .required();

exports.createEntryDto = input =>
  matchSchemaOrThrow({ input, schema: entrySchema, error: EntryValidationError });
