const express = require('express');
const isMain = require('is-main');

function createTokenRegistry() {
  return express();
}

module.exports = createTokenRegistry;

if (isMain(module)) {
  const port = process.env.NODE_PORT || 3000;

  createTokenRegistry().listen(port);

  console.log(`listening at port ${port}`);
}
