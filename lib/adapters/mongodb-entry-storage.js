/**
 * @module adapters/mongodb-entry-storage
 */

/**
 * Collection name to be used by default.
 * @type {String}
 */
const DEFAULT_COLLECTION_NAME = 'fcm_tokens';
const DEFAULT_CONTEXT = { collectionName: DEFAULT_COLLECTION_NAME };

/**
 * Allows saving and retrieving entries from a mongodb database.
 * @param  {Object} context [description]
 * @param  {mongodb.Db} context.db MongoDB database object.
 * @return {Storage}
 */
const createMongoDbEntryStorage = (context) => {
  const { db, collectionName } = Object.assign({}, DEFAULT_CONTEXT, context);
  const collection = db.collection(collectionName);

  return {
    /**
     * @return {Promise<Entry[]>}
     */
    getAllEntries() {
      return collection.find().toArray();
    },
    /**
     * @param  {String} groupId
     * @return {Promise<Entry[]>}
     */
    getEntriesByGroupId(groupId) {
      return collection.find({ belongsTo: groupId }).toArray();
    },
    /**
     * @param  {Entry} input
     * @return {Promise<Entry>}
     */
    saveEntry(input) {
      return collection.insertOne(input, { returnOriginal: false }).then(() => input);
    },
    /**
     * @param  {Entry} entry
     * @return {Promise<Boolean>}
     */
    exists(entry) {
      return collection.count(entry).then(c => c > 0);
    },
  };
};

exports.factory = createMongoDbEntryStorage;
exports.DEFAULT_COLLECTION_NAME = DEFAULT_COLLECTION_NAME;
