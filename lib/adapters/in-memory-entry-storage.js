const createEntryDto = require('../dtos');

const createInMemoryEntryStorage = ({ entries }) => ({
  entries: entries || [],
  async getAllEntries() {
    return this.entries;
  },
  async getEntriesByGroupId(gid) {
    return this.entries.filter(e => e.belongsTo === gid);
  },
  async saveEntry(input) {
    this.entries.push(createEntryDto(input));
  },
});

module.exports = createInMemoryEntryStorage;
