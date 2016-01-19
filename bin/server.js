#!/usr/bin/env node

// requires
var Sequelize = require('sequelize');
var express = require('express');

var app = express();

/**
 * setup database
 * @param  {string} dialect type of db mysql|sqlite
 * @param  {string} storage file used for sqlite, default ./credit.db
 * @return {Object} sequelize db object
 */
function setupDB(config) {
  var sequelize;
  var defaultStorage = 'credit.db';

  if (config.dialect === 'sqlite') {
    if (!config.storage) {
      config.storage = defaultStorage;
    }

    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect,
      storage: config.storage,
      logging: false,

      pool: false

    });
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect,
      logging: false,

      pool: false

    });
  }
  return sequelize;
}


/**
 * start server
 * @param  {Object} sequelize db object
 */
function startServer(sequelize, config) {
  app.get('/', function (req, res) {
    var ret = '';

    res.send('main');

  });

  app.get('/balance', function (req, res) {

    var coinbase = 'https://w3id.org/cc#coinbase';
    var currency = 'https://w3id.org/cc#bit';
    var initial  = 1000000;
    var source   = req.query.source;

    if (!source) {
      res.send('source required');
      return;
    }

    if (!config.wallet) {
      config.wallet = null;
    }

    var coinbaseSql = 'Select amount from Ledger where source = :source and wallet = :wallet ;';

    sequelize.query(coinbaseSql,  { replacements: { wallet: config.wallet, source: source } }).then(function(bal) {
      return bal;
    }).catch(function(err){
      console.log('Balance Failed.', err);
    }).then(function(bal) {
      if (bal[0][0]) {
        console.log('balance for ' + source + ' : ' + bal[0][0].amount);
        res.send('balance for ' + source + ' : ' + bal[0][0].amount);
      }
    });


  });

  app.get('/insert', function (req, res) {

    res.send('insert');

  });

  app.get('/tx', function (req, res) {

    res.send('tx');

  });

  var server = app.listen(11077, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
  });

}

/**
 * server function
 * @param  {Object} config [description]
 */
function server(config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  startServer(sequelize, config);
}


/**
 * version as a command
 */
function bin(argv) {
  // setup config
  var config = require('./dbconfig.js');

  server(config);
}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}

module.exports = server;
