const createInMemoryEntryStorage = context => ({
  entries: (context && context.entries) || [],
  getAllEntries() {
    return Promise.resolve(this.entries);
  },
  getEntriesByGroupId(gid) {
    return Promise.resolve(this.entries.filter(e => e.belongsTo === gid));
  },
  saveEntry(input) {
    this.entries.push(input);

    return Promise.resolve(null);
  },
});

module.exports = createInMemoryEntryStorage;
