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
  exists(entry) {
    const matchingEntry = match => e => match.belongsTo === e.belongsTo && match.token === e.token;
    return Promise.resolve(this.entries.find(matchingEntry(entry))).then(e => !!e);
  },
});

module.exports = createInMemoryEntryStorage;
