# FCM Token Registry
[![Build status](https://img.shields.io/travis/xrps/fcm-token-registry.svg?style=flat-square)](https://travis-ci.org/xrps/fcm-token-registry)[![Code coverage status](https://img.shields.io/coveralls/github/xrps/fcm-token-registry.svg?style=flat-square)](https://coveralls.io/github/xrps/fcm-token-registry?branch=master)

> An HTTP web server for managing Firebase Cloud Messaging device tokens.

```js
const createInMemoryStorage = require('@xrps/fcm-token-registry/lib/adapters/in-memory-entry-storage');
const createRegistry = require('@xrps/fcm-token-registry/lib/registry');
const { factory: createApi } = require('@xrps/fcm-token-registry');

const storage = createInMemoryStorage({ entries: [] });
const registry = createRegistry({ storage });
const api = createApi({ registry });

api.listen(3000);
```

## Features
* _Minimalist_. Exposes a small set of endpoints.
* _Extensible_. New functionally can be added by injecting `express` middleware.
* _Convenient_. Can be ran as an HTTP server or `use`-d as an express middleware.
* _Flexible_. Can be used as a whole or in parts.

## Installation
```sh
$ npm install @xrps/fcm-token-registry
```

## Usage
As a standalone server:
```js
const mongodb = require('mongodb');

const { factory: createMongoDbStorage } = require('@xrps/fcm-token-registry/lib/adapters/mongodb-entry-storage');
const createRegistry = require('@xrps/fcm-token-registry/lib/registry');
const { factory: createApi } = require('@xrps/fcm-token-registry');

const dbUri = 'mongodb://localhost:27017';
const dbName = 'fcm-registry';

function start() {
  // assumes mongodb@3.x
  return mongodb.MongoClient
    .connect(dbUri)
    .then((dbClient) => {
      const db = dbClient.db(dbName);
      const entryStorage = createMongoDbStorage({ db });
      const registry = createRegistry({ entryStorage });
      const api = createApi({ registry });

      const server = api.listen(3000);

      server.on('listening', () => {
        console.log('listening for incoming connections at port 3000');
      });
    });
}

start();
  .catch(e => console.error(e));
```

As an middleware for express:
```js
const express = require('express')

const createInMemoryFcmTokenStorage = require('@xrps/fcm-token-registry/lib/adapters/in-memory-entry-storage');
const createFcmTokenRegistry = require('@xrps/fcm-token-registry/lib/registry');
const { factory: createFcmTokenRegistryApi } = require('@xprs/fcm-token-registry');

const app = express();
const fcmTokenRegistryApi = createFcmTokenRegistryApi({ entryStorage: createInMemoryFcmTokenStorage() });

// ... do usual, express-related stuff, then

app.use('/device-tokens', fcmTokenRegistryApi);

// ... more express stuff

app.listen(3000);
```

Only certain parts:
```js
/**
 * Suppose you'd like to be able to print all tokens assigned to a given user email (group ID) in the command-line.
 */
const userEmail = process.argv[1];

function start() {
  // assumes mongodb@3.x
  return mongodb.MongoClient
    .connect(dbUri)
    .then((dbClient) => {
      const db = dbClient.db(dbName);
      const entryStorage = createMongoDbStorage({ db });
      const registry = createRegistry({ entryStorage });

      return registry
        .getEntriesByGroupId(userEmail)
        .then((entries) => entries.forEach(({ token }) => console.log(token)));
    });
}

start()
  .catch(e => console.error(e));
```

## API

API documentation is hosted [here](https://xrps.github.io/fcm-token-registry/).

## Examples

Coming soon.

## Road-map

Coming soon.
