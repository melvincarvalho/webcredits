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
function createTables(sequelize) {
  var create_credit = 'CREATE TABLE Credit ( \
    `@id` TEXT, \
    `source` TEXT, \
    `amount` REAL, \
    `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
    `destination` TEXT, \
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \
    `context` TEXT, \
    `description` TEXT, \
    `wallet` TEXT \
  );';

  var create_ledger = 'CREATE TABLE Ledger ( \
    `source` TEXT, \
    `amount` REAL, \
    `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
    `wallet` TEXT \
  );';

  var create_genesis = 'CREATE TABLE Genesis ( \
    `source` TEXT, \
    `amount` REAL, \
    `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
    `wallet` TEXT \
  );'

  sequelize.query(create_credit).then(function(res) {
  }).then(function(){
    sequelize.query(create_ledger);
  }).then(function(){
    sequelize.query(create_genesis);
  }).then(function(){
    console.log('Sucessfully created tables!');
  }).catch(function(err){
    console.log('Failed to create tables.', err);
  }).then(function() {
    console.log('Complete');
  });
}

/**
 * createDB function
 * @param  {Object} config [description]
 */
function createDB(config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  createTables(sequelize);
}


/**
 * version as a command
 */
function bin(argv) {
  // setup config
  var config = require('./dbconfig.js');

  createDB(config);
}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}

module.exports = createDB;
