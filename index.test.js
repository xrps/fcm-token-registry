const test = require('ava');
const isExpressApp = require('is-express-app');

const createTokenRegistry = require('./');

const isFunction = fn => typeof fn === 'function';

// just a dummy test...
test('returns an express app factory', (t) => {
  t.true(isFunction(createTokenRegistry));
  t.true(isExpressApp(createTokenRegistry()));
});
