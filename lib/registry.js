const { createEntryDto, createGroupIdDto } = require('./dtos');

const createRegistry = ({ entryStorage }) => ({
  getAllEntries() {
    return entryStorage.getAllEntries().then(entries => entries.map(createEntryDto));
  },
  getEntriesByGroupId(groupId) {
    return entryStorage
      .getEntriesByGroupId(createGroupIdDto(groupId))
      .then(entries => entries.map(createEntryDto));
  },
  saveEntry(input) {
    const entry = createEntryDto(input);

    return this.exists(input)
      .then(exists => (exists ? entry : entryStorage.saveEntry(entry)))
      .then(createEntryDto);
  },
  exists(input) {
    return entryStorage.exists(createEntryDto(input));
  },
});

module.exports = createRegistry;
