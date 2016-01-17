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


        if (credit["https://w3id.org/cc#created"]) {
          credit["https://w3id.org/cc#created"] = credit["https://w3id.org/cc#created"].replace(' ', 'T');
          if (credit["https://w3id.org/cc#created"].charAt(credit["https://w3id.org/cc#created"].length-1) != 'Z') {
            credit["https://w3id.org/cc#created"] += 'Z';
          }
        } else {
          credit["https://w3id.org/cc#created"] = new Date().toISOString();
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

  }).catch(function(err){
    console.log('Failed to insert credit.', err);
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
  return sequelize;
}


/**
 * version as a command
 */
function bin(argv) {
  // setup config
  var config = require('./dbconfig.js');

  var credit = {};
/*
  "https://w3id.org/cc#created": { "@value" : credit["https://w3id.org/cc#created"], "@type" : "http://www.w3.org/2001/XMLSchema#dateTime" } ,
  "https://w3id.org/cc#source": { "@id": credit["https://w3id.org/cc#source"] },
  "https://w3id.org/cc#amount": { "@value" : credit["https://w3id.org/cc#amount"], "@type" : "http://www.w3.org/2001/XMLSchema#decimal" } ,
  "https://w3id.org/cc#destination": { "@id": credit["https://w3id.org/cc#destination"] },
  "https://w3id.org/cc#currency": { "@id": credit["https://w3id.org/cc#currency"] },
  "@type": "https://w3id.org/cc#Credit"
*/
  credit["@type"]                                = 'https://w3id.org/cc#Credit';
  credit["https://w3id.org/cc#source"]           = argv[2];
  credit["https://w3id.org/cc#amount"]           = argv[3];
  credit["https://w3id.org/cc#currency"]         = argv[4];
  credit["https://w3id.org/cc#destination"]      = argv[5];
  credit["http://purl.org/dc/terms/description"] = argv[6];
  credit["https://w3id.org/cc#created"]          = argv[7];


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










/*


















db.serialize(function() {

  // check if exists and build query
  var sql = "SELECT * FROM credit where source = '"+ source + "' and destination = '" + destination + "' and amount = " + amount
  if ( description ) {
    sql +=  " and description = '" + description + "'";
  } else {
    sql +=  " and description = null";
  }
  if ( timestamp ) {
    sql +=  " and timestamp = '" + timestamp + "'";
  } else {
    sql +=  " and timestamp = null";
  }
  console.log(sql);
  db.each(sql, function(err, row) {
    if (err) {
      console.log(err);
    }
  }, function(err, numrows) {

    if (err) {
      console.log(err);
      process.exit(-1);
    } else if (numrows > 0) {
      // if exists exit
      console.log('row already exists');
      process.exit(-1);
    } else {
      // we have a new row, check for funds

      console.log('checking balance');
      var sql = "SELECT * FROM ledger where source = '" + source + "'";
      console.log(sql);
      db.each(sql, function(err, row) {
        if (err) {
          console.log(err);
          process.exit(-1);
        } else {
          var balance = row.amount;
          console.log('balance is : ' + balance);
          if ( balance < amount ) {
            console.log("sorry, not enough funds");
            process.exit(-1);
          }
        }
      }, function(err, numrows){
        if (err) {
          console.log(err);
          process.exit(-1);
        } else if (numrows === 0) {
          console.log('no entry in ledger');
          process.exit(-1);
        } else {
          // we have funds so lets make a credit and update ledger
          console.log('adding to credits');

          if (timestamp) {
            timestamp = timestamp.replace(' ', 'T');
            if (timestamp.charAt(timestamp.length-1) != 'Z') {
              timestamp += 'Z';
            }
          } else {
            timestamp = new Date().toISOString();
          }


          var doc = {
            "https://w3id.org/cc#created": { "@value" : timestamp, "@type" : "http://www.w3.org/2001/XMLSchema#dateTime" } ,
            "https://w3id.org/cc#source": { "@id": source },
            "https://w3id.org/cc#amount": { "@value" : amount, "@type" : "http://www.w3.org/2001/XMLSchema#decimal" } ,
            "https://w3id.org/cc#destination": { "@id": destination },
            "https://w3id.org/cc#currency": { "@id": unit },
            "@type": "https://w3id.org/cc#Credit"
          };

          jsonld.normalize(doc, {format: 'application/nquads'}, function(err, normalized) {

            // normalized is a string that is a canonical representation of the document
            // that can be used for hashing
            //console.log(normalized);

            var hash = crypto.createHash('sha256').update(normalized).digest('base64');
            //console.log(hash);

            // helper functions
            function base64url_encode(data) {
              return btoa(data);
            }


            var id = 'ni:///sha-256;' + new Buffer(hash).toString('base64').replace('+', '-').replace('/', '_').replace('=', '');
            doc['@id'] = id;
            console.log(doc);



            var sql = "INSERT INTO credit(\"@id\", 'source', 'destination', 'amount', 'timestamp', 'currency'";
            if (description) sql += ", 'description'";
            sql += ") values ( '" + id + "', '"+ source + "' , '" + destination + "' , " + amount;
            sql += " , '" + timestamp + "'" + " , '" + unit + "'";
            if (description) sql+= " , '" + description + "'";
            sql += " )";


            console.log(sql);
            db.run(sql);

            // decrement source
            console.log('decrement source');
            var sql = "UPDATE ledger set amount = amount - " + amount + " where source = '"+ source + "' ";
            console.log(sql);
            db.run(sql);

            // increment or add destination
            console.log('increment or add destination');
            var sql = "SELECT * FROM ledger where source= '" + destination + "'";
            console.log(sql);
            db.each(sql, function(){}, function(err, numrows){
              console.log('numrows : ' + numrows);
              if (numrows > 0 ) {
                var sql = "UPDATE ledger set amount = amount + " + amount + " where source = '"+ destination + "' ";
              } else {
                var sql = "INSERT INTO ledger  ('source', 'amount') VALUES  ( '" + destination + "', " + amount + " ) ";
              }
              console.log(sql);
              db.run(sql);

            });

          });


        }

      });

    }

  });

});
*/
