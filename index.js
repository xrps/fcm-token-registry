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
