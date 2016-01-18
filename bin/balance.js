#!/usr/bin/env node

// requires
var Sequelize = require('sequelize');

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
* create tables
 * @param  {Object} sequelize db object
 */
function getBalance(source, sequelize, config) {
  var coinbase = 'https://w3id.org/cc#coinbase';
  var currency = 'https://w3id.org/cc#bit';
  var initial  = 1000000;

  if (!config.wallet) {
    config.wallet = null;
  }

  var coinbaseSql = 'Select amount from Ledger where source = :source and wallet = :wallet ;';

  sequelize.query(coinbaseSql,  { replacements: { wallet: config.wallet, source: source } }).then(function(res) {
    return res;
  }).catch(function(err){
    console.log('Balance Failed.', err);
  }).then(function(res) {
    if (res[0][0]) {
      console.log(res[0][0].amount);
      sequelize.close();
    }
  });
}

/**
 * genesis function
 * @param  {Object} config [description]
 */
function balance(source, config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  var res = getBalance(source, sequelize, config);
}


/**
 * version as a command
 */
function bin(argv) {
  // setup config
  var config = require('./dbconfig.js');

  var source = process.argv[2];

  if (!source) {
    console.error('Source is required');
    process.exit(-1);
  }

  balance(source, config);
}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}

module.exports = balance;
