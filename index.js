const express = require('express');
const isMain = require('is-main');
const httpStatus = require('http-status');
const bodyParser = require('body-parser');

const createInMemoryEntryStorage = require('./lib/adapters/in-memory-entry-storage');
const { EntryValidationError } = require('./lib/errors');
const { createEntryDto } = require('./lib/dtos');

const routes = Object.freeze({
  ENTRIES: '/',
  ENTRIES_OF_GROUP: '/:groupId',
});

function factory({ entryStorage }) {
  const app = express();

  app.get(routes.ENTRIES, (req, res, next) => {
    entryStorage
      .getAllEntries()
      .then(entries => res.status(httpStatus.OK).json(entries))
      .catch(next);
  });

  app.get(routes.ENTRIES_OF_GROUP, (req, res, next) => {
    entryStorage
      .getEntriesByGroupId(req.params.groupId)
      .then(entries => res.status(httpStatus.OK).json(entries))
      .catch(next);
  });

  app.post(routes.ENTRIES_OF_GROUP, bodyParser.json(), (req, res, next) => {
    entryStorage
      .saveEntry(createEntryDto({ token: req.body.token, belongsTo: req.params.groupId }))
      .then(newEntry => res.status(httpStatus.OK).json(newEntry))
      .catch(next);
  });

  app.use((err, req, res, next) => {
    const errorHandlers = {
      [EntryValidationError.name]: () =>
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
          name: err.name,
          message: err.message,
        }),
    };

    const onError = errorHandlers[err.name] || next;

    onError();
  });

  return app;
}

exports.factory = factory;
exports.routes = routes;

if (isMain(module)) {
  const port = process.env.NODE_PORT || 3000;
  const entryStorage = createInMemoryEntryStorage({ entries: [] });

  factory({ entryStorage }).listen(port);

  console.log(`listening at port ${port}`);
}
