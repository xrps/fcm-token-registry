const express = require('express');
const httpStatus = require('http-status');
const bodyParser = require('body-parser');
const swaggerUiDist = require('swagger-ui-dist');

const { EntryValidationError } = require('./lib/errors');
const swaggerDocument = require('./swagger.json');

const routes = Object.freeze({
  ENTRIES: '/',
  ENTRIES_OF_GROUP: '/:groupId',
  API_SPEC: '/_swagger',
  API_SPEC_JSON: '/_swagger.json',
});

function factory({ registry }) {
  const app = express();

  app.use(routes.API_SPEC, (req, res, next) => {
    // NOTE: instruct swagger ui to load our swagger file.
    // TODO: improve this.
    if (req.url === '/' && req.query.url !== routes.API_SPEC_JSON) {
      res.redirect(`${routes.API_SPEC}?url=${routes.API_SPEC_JSON}`);

      return;
    }

    express.static(swaggerUiDist.absolutePath())(req, res, next);
  });
  app.get(routes.API_SPEC_JSON, (req, res) => res.json(swaggerDocument));

  app.get(routes.ENTRIES, (req, res, next) => {
    registry
      .getAllEntries()
      .then(entries => res.status(httpStatus.OK).json(entries))
      .catch(next);
  });

  app.get(routes.ENTRIES_OF_GROUP, (req, res, next) => {
    registry
      .getEntriesByGroupId(req.params.groupId)
      .then(entries => res.status(httpStatus.OK).json(entries))
      .catch(next);
  });

  app.post(routes.ENTRIES_OF_GROUP, bodyParser.json(), (req, res, next) => {
    registry
      .saveEntry({ token: req.body.token, belongsTo: req.params.groupId })
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
