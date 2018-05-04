const express = require('express');
const isMain = require('is-main');
const httpStatus = require('http-status');

const routes = Object.freeze({
  ENTRIES: '/',
});

function factory({ entryStorage }) {
  const app = express();

  app.get(routes.ENTRIES, (req, res, next) => {
    entryStorage
      .getAllEntries()
      .then(entries => res.status(httpStatus.OK).json(entries))
      .catch(next);
  });

  return app;
}

exports.factory = factory;
exports.routes = routes;

if (isMain(module)) {
  const port = process.env.NODE_PORT || 3000;

  factory().listen(port);

  console.log(`listening at port ${port}`);
}
