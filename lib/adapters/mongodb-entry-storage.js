const DEFAULT_COLLECTION_NAME = 'fcm_tokens';
const DEFAULT_CONTEXT = { collectionName: DEFAULT_COLLECTION_NAME };

const createMongoDbEntryStorage = (context) => {
  const { db, collectionName } = Object.assign({}, DEFAULT_CONTEXT, context);
  const collection = db.collection(collectionName);

  return {
    getAllEntries() {
      return collection.find().toArray();
    },
    getEntriesByGroupId(groupId) {
      return collection.find({ belongsTo: groupId }).toArray();
    },
    saveEntry(input) {
      return collection.insertOne(input, { returnOriginal: false }).then(() => input);
    },
    exists(entry) {
      return collection.count(entry).then(c => c > 0);
    },
  };
};

exports.factory = createMongoDbEntryStorage;
exports.DEFAULT_COLLECTION_NAME = DEFAULT_COLLECTION_NAME;
