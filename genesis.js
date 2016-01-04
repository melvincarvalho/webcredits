// requires
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'webcredits'
});

connection.connect();

var coinbase = 'https://w3id.org/cc#coinbase';
var currency = 'https://w3id.org/cc#bit';
var initial  = 1000000;

connection.query('Insert into Ledger values ( \''+ coinbase +'\', '+ initial +', \''+ currency +'\', NULL );', function(err, rows, fields) {
  if (err) {
    console.error(err);
  }

  console.log('Ledger setup successful');
});


connection.query('Insert into Genesis values ( \''+ coinbase +'\', '+ initial +', \''+ currency +'\', NULL );', function(err, rows, fields) {
  if (err) {
    console.error(err);
  }

  console.log('Genesis successful');
});


connection.end();
