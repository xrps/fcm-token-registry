const createEntryDto = require('../dtos');

const createInMemoryEntryStorage = ({ entries }) => ({
  entries: entries || [],
  getAllEntries() {
    return Promise.resolve(this.entries);
  },
  getEntriesByGroupId(gid) {
    return Promise.resolve(this.entries.filter(e => e.belongsTo === gid));
  },
  saveEntry(input) {
    this.entries.push(createEntryDto(input));

    return Promise.resolve(null);
  },
});

module.exports = createInMemoryEntryStorage;
