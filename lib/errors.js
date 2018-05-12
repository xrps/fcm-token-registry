/**
 * @module errors
 */

/**
 * Thrown whenever an entry object fails to validate.
 * @type {Object}
 */
exports.EntryValidationError = {
  name: 'EntryValidationError',
  message: 'a validation failed while creating a new token registry entry',
};

/**
 * Thrown whenever a group ID fails to validate.
 * @type {Object}
 */
exports.GroupIdValidationError = {
  name: 'GroupIdValidationError',
  message: 'a validation for a group id failed',
};
