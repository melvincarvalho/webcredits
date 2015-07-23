// requires
var sqlite3 = require('sqlite3');
var jsonld = require('jsonld');
var crypto = require('crypto');

// init
var store = 'sqlite';
var storename = __dirname + '/credit.db';
var db = new sqlite3.Database(storename);


var argv = process.argv;
var source      = argv[2];
var amount      = argv[3];
var unit        = argv[4];
var destination = argv[5];
var description = argv[6];
var timestamp   = argv[7];


// clean and validate
if (!source) {
  console.error('source is required');
  process.exit(-1);
}

if (!amount || isNaN(amount) ) {
  console.error('amount is required and must be a number');
  process.exit(-1);
}

if (!unit) {
  unit = 'https://w3id.org/cc#bit';
}

if (!destination) {
  console.error('destination is required');
  process.exit(-1);
}



// main
console.log('source : ' + source);
console.log('amount : ' + amount);
console.log('unit : ' + unit);
console.log('destination : ' + destination);
console.log('description : ' + description);
console.log('timestamp : ' + timestamp);


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
