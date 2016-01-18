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
      storage: config.storage
    });
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect
    });
  }
  return sequelize;
}


/**
* create tables
 * @param  {Object} sequelize db object
 */
function genesisInit(sequelize, config) {
  var coinbase = 'https://w3id.org/cc#coinbase';
  var currency = 'https://w3id.org/cc#bit';
  var initial  = 1000000;

  if (!config.wallet) {
    config.wallet = null;    
  }

  var coinbaseSql = 'Insert into Ledger values ( \''+ coinbase +'\', '+ initial +', \''+ currency +'\', :wallet );';
  var genesisSql  = 'Insert into Genesis values ( \''+ coinbase +'\', '+ initial +', \''+ currency +'\', :wallet );';

  sequelize.query(coinbaseSql,  { replacements: { wallet: config.wallet } }).then(function(res) {
  }).then(function(){
    sequelize.query(genesisSql,  { replacements: { wallet: config.wallet } });
  }).then(function(){
    console.log('Genesis successful!');
  }).catch(function(err){
    console.log('Genesis Failed.', err);
  }).then(function() {
    console.log('Complete');
  });
}

/**
 * genesis function
 * @param  {Object} config [description]
 */
function genesis(config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  genesisInit(sequelize, config);
}


/**
 * version as a command
 */
function bin(argv) {
  // setup config
  var config = require('./dbconfig.js');

  genesis(config);
}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}

module.exports = genesis;
