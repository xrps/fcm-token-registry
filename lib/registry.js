const { createEntryDto } = require('./dtos');

const createRegistry = ({ entryStorage }) => ({
  getAllEntries() {
    return entryStorage.getAllEntries();
  },
  getEntriesByGroupId(groupId) {
    return entryStorage.getEntriesByGroupId(groupId);
  },
  saveEntry(input) {
    return entryStorage.saveEntry(createEntryDto(input));
  },
  exists(input) {
    return entryStorage.exists(createEntryDto(input));
  },
});

module.exports = createRegistry;
