const express = require('express');
const httpStatus = require('http-status');
const bodyParser = require('body-parser');
const swaggerUiDist = require('swagger-ui-dist');

const { EntryValidationError } = require('./lib/errors');
const { createEntryDto } = require('./lib/dtos');
const swaggerDocument = require('./swagger.json');

const routes = Object.freeze({
  ENTRIES: '/',
  ENTRIES_OF_GROUP: '/:groupId',
});

function factory({ entryStorage }) {
  const app = express();

  app.use('/_swagger', (req, res, next) => {
    // NOTE: instruct swagger ui to load our swagger file.
    // TODO: improve this.
    if (req.url === '/' && req.query.url !== '/_swagger.json') {
      res.redirect('/_swagger?url=/_swagger.json');

      return;
    }

    express.static(swaggerUiDist.absolutePath())(req, res, next);
  });
  app.get('/_swagger.json', (req, res) => res.json(swaggerDocument));

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
    const entry = createEntryDto({ token: req.body.token, belongsTo: req.params.groupId });

    entryStorage
      .exists(entry)
      .then(exists => (exists ? Promise.resolve(entry) : entryStorage.saveEntry(entry)))
      .then(newEntry => res.status(httpStatus.OK).json(newEntry))
      .catch(next);
  });

  app.use((err, req, res, next) => {
    const errorHandlers = {
      [EntryValidationError.name]: e =>
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
          name: e.name,
          message: e.message,
        }),
    };

    const onError = errorHandlers[err.name] || next;

    onError(err);
  });

  return app;
}

exports.factory = factory;
exports.routes = routes;
