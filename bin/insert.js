#!/usr/bin/env node

// requires
var Sequelize = require('sequelize');
var jsonld = require('jsonld');
var crypto = require('crypto');
var promises = jsonld.promises;

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
* insert credit
* @param  {Object} sequelize db object
*/
function insert(credit, sequelize) {

  // main
  console.log('source : ' + credit["https://w3id.org/cc#source"]);
  console.log('amount : ' + credit["https://w3id.org/cc#amount"]);
  console.log('unit : ' + credit["https://w3id.org/cc#currency"]);
  console.log('destination : ' + credit["https://w3id.org/cc#destination"]);
  console.log('description : ' + credit["http://purl.org/dc/terms/description"]);
  console.log('timestamp : ' + credit["https://w3id.org/cc#created"]);


  // check if exists and build query
  var existsSql = "SELECT * FROM Credit where source = '"+ credit["https://w3id.org/cc#source"] + "' and destination = '" + credit["https://w3id.org/cc#destination"] + "' and amount = " + credit["https://w3id.org/cc#amount"];
  if ( credit["http://purl.org/dc/terms/description"] ) {
    existsSql +=  " and description = '" + credit["http://purl.org/dc/terms/description"] + "'";
  } else {
    existsSql +=  " and description = null";
  }
  if ( credit["https://w3id.org/cc#created"] ) {
    existsSql +=  " and timestamp = '" + credit["https://w3id.org/cc#created"] + "'";
  } else {
    existsSql +=  " and timestamp = null";
  }
  console.log(existsSql);

  //existsSql = 'select 1 + 1';

  sequelize.query(existsSql).then(function(res) {
    console.log('checking if row exists');
    console.log(res);
    if (res[0][0]) {
      console.log('row exists');
      throw ('row exists');
    } else {
      console.log('row does not exist');
      console.log('Getting balance');
      var balanceSql = "SELECT * FROM Ledger where source = '" + credit["https://w3id.org/cc#source"] + "'";
      return sequelize.query(balanceSql);
    }
  }).then(function(res){
    if (res[0][0] && res[0][0].amount) {
      console.log('balance is ' + res[0][0].amount);
      if (res[0][0].amount >= credit["https://w3id.org/cc#amount"]) {
        console.log('funds available');


        if (credit["https://w3id.org/cc#timestamp"]) {
          credit["https://w3id.org/cc#timestamp"] = credit["https://w3id.org/cc#timestamp"].replace(' ', 'T');
          if (credit["https://w3id.org/cc#timestamp"].charAt(credit["https://w3id.org/cc#timestamp"].length-1) != 'Z') {
            credit["https://w3id.org/cc#timestamp"] += 'Z';
          }
        } else {
          credit["https://w3id.org/cc#timestamp"] = new Date().toISOString();
        }


        var doc = {
          "https://w3id.org/cc#created": { "@value" : credit["https://w3id.org/cc#created"], "@type" : "http://www.w3.org/2001/XMLSchema#dateTime" } ,
          "https://w3id.org/cc#source": { "@id": credit["https://w3id.org/cc#source"] },
          "https://w3id.org/cc#amount": { "@value" : credit["https://w3id.org/cc#amount"], "@type" : "http://www.w3.org/2001/XMLSchema#decimal" } ,
          "https://w3id.org/cc#destination": { "@id": credit["https://w3id.org/cc#destination"] },
          "https://w3id.org/cc#currency": { "@id": credit["https://w3id.org/cc#currency"] },
          "@type": "https://w3id.org/cc#Credit"
        };
        console.log(doc);
        return promises.normalize(doc, {format: 'application/nquads'});

      } else {
        throw ('not enough funds');
      }
    } else {
      throw ('could not find balance');
    }
  }).then(function(doc){
    console.log('Sucessfully normalized doc to json ld!');
    var hash = crypto.createHash('sha256').update(doc).digest('base64');
    console.log(hash);

    var id = 'ni:///sha-256;' + new Buffer(hash).toString('base64').replace('+', '-').replace('/', '_').replace('=', '');
    credit['@id'] = id;
    console.log(credit);



    var insertSql = "INSERT INTO Credit(\`@id\`, `source`, `destination`, `amount`, `timestamp`, `currency`";
    if (credit["https://w3id.org/cc#description"]) insertSql += ", `description`";
    insertSql += ") values ( '" + credit['@id'] + "', '"+ credit["https://w3id.org/cc#source"] + "' , '" + credit["https://w3id.org/cc#destination"] + "' , " + credit["https://w3id.org/cc#amount"];
    insertSql += " , '" + credit["https://w3id.org/cc#timestamp"] + "'" + " , '" + credit["https://w3id.org/cc#amount"] + "'";
    if (credit["http://purl.org/dc/terms/description"]) insertSql+= " , '" + credit["http://purl.org/dc/terms/description"] + "'";
    insertSql += " )";

    console.log(insertSql);

    return sequelize.query(insertSql);

  }).then(function(res){
    console.log('decrementing source');
    var decrementSql = "UPDATE Ledger set amount = amount - " + credit["https://w3id.org/cc#amount"] + " where source = '"+ credit["https://w3id.org/cc#source"] + "' ";
    return sequelize.query(decrementSql);

  }).then(function(res){
    console.log('incrementing or creating destination');
    var checkSql = "SELECT * from Ledger where `source` =  '" + credit["https://w3id.org/cc#destination"] + "'";
    return sequelize.query(checkSql);
  }).then(function(res){
    var incrementSql;
    if (res[0][0] && res[0][0].amount) {
      incrementSql = "UPDATE Ledger set `amount` = `amount` + " + credit["https://w3id.org/cc#amount"] + " where `source` =  '" + credit["https://w3id.org/cc#destination"] + "'";
    } else {
      incrementSql = "INSERT into Ledger (`source`, `amount`) values ('"+ credit["https://w3id.org/cc#destination"] +"', "+credit["https://w3id.org/cc#amount"] +")";
    }
    return sequelize.query(incrementSql);

  }).then(function() {
    console.log('Complete');
    // hook

  }).catch(function(err){
    console.log('Failed to insert credit.', err);
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
  return sequelize;
}


/**
* version as a command
*/
function bin(argv) {
  // setup config
  var config = require('./dbconfig.js');

  var credit = {};

  credit["@type"]                                = 'https://w3id.org/cc#Credit';
  credit["https://w3id.org/cc#source"]           = argv[2];
  credit["https://w3id.org/cc#amount"]           = argv[3];
  credit["https://w3id.org/cc#currency"]         = argv[4];
  credit["https://w3id.org/cc#destination"]      = argv[5];
  credit["http://purl.org/dc/terms/description"] = argv[6];
  credit["https://w3id.org/cc#timestamp"]        = argv[7];


  // clean and validate
  if (!credit["https://w3id.org/cc#source"]) {
    console.error('source is required');
    process.exit(-1);
  }

  if (!credit["https://w3id.org/cc#amount"] || isNaN(credit["https://w3id.org/cc#amount"]) ) {
    console.error('amount is required and must be a number');
    process.exit(-1);
  }

  if (!credit["https://w3id.org/cc#currency"]) {
    credit["https://w3id.org/cc#currency"] = 'https://w3id.org/cc#bit';
  }

  if (!credit["https://w3id.org/cc#destination"]) {
    console.error('destination is required');
    process.exit(-1);
  }

  var sequelize = createDB(config);
  insert(credit, sequelize);

}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}

module.exports = insert;
