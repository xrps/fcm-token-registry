/**
 * @module registry
 * @see module:dtos
 */

/**
 * @typedef Storage
 * @prop {Function} getAllEntries
 * @prop {Function} getEntriesByGroupId
 * @prop {Function} saveEntry
 * @prop {Function} exists
 */

const { createEntryDto, createGroupIdDto } = require('./dtos');

/**
 * Creates a new registry service instance.
 * @param  {Object} context
 * @param  {Storage} context.entryStorage Storage
 * @return {Registry}
 */
const createRegistry = ({ entryStorage }) => ({
  /**
   * Returns all entries in the registry
   * @return {Promise<Entry[]>}
   */
  getAllEntries() {
    return entryStorage.getAllEntries().then(entries => entries.map(createEntryDto));
  },
  /**
   * Returns all entries belonging to a certain group ID.
   * @param  {String} groupId
   * @return {Promise<Entry[]>}
   */
  getEntriesByGroupId(groupId) {
    return entryStorage
      .getEntriesByGroupId(createGroupIdDto(groupId))
      .then(entries => entries.map(createEntryDto));
  },
  /**
   * Saves a new entry.
   * Validates input.
   * @param {Entry} input
   * @return {Promise<Entry>} The original input if entry is valid.
   */
  saveEntry(input) {
    const entry = createEntryDto(input);

    return this.exists(input)
      .then(exists => (exists ? entry : entryStorage.saveEntry(entry)))
      .then(createEntryDto);
  },
  /**
   * Checks whether an entry is already registered for a given group ID.
   * @param {Entry} input
   * @return {Promise<Boolean>}
   */
  exists(input) {
    return entryStorage.exists(createEntryDto(input));
  },
});

module.exports = createRegistry;
