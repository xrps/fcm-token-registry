/**
 * @module adapters/in-memory-entry-storage
 * @see module:registry
 */

/**
 * Allows saving and retrieving entries in memory.
 * @param  {Object}   context
 * @param  {Entry[]}  context.entries Initial entries
 * @return {Storage}
 */
const createInMemoryEntryStorage = context => ({
  /**
   * @type {Entry[]}
   */
  entries: (context && context.entries) || [],
  /**
   * @return {Promise<Entry[]>}
   */
  getAllEntries() {
    return Promise.resolve(this.entries);
  },
  /**
   * @param  {String} gid group id
   * @return {Promise<Entry[]>}
   */
  getEntriesByGroupId(gid) {
    return Promise.resolve(this.entries.filter(e => e.belongsTo === gid));
  },
  /**
   * @param  {Entry} input
   * @return {Promise<Entry>}
   */
  saveEntry(input) {
    this.entries.push(input);

    return Promise.resolve(input);
  },
  /**
   * @param  {Entry} entry
   * @return {Promise<Boolean>}
   */
  exists(entry) {
    const matchingEntry = match => e => match.belongsTo === e.belongsTo && match.token === e.token;
    return Promise.resolve(this.entries.find(matchingEntry(entry))).then(e => !!e);
  },
});

module.exports = createInMemoryEntryStorage;
