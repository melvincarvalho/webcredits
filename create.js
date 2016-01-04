// requires
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'webcredits'
});

connection.connect();

connection.query('CREATE TABLE Credit ( \
  `@id` TEXT, \
  `source` TEXT, \
  `amount` REAL, \
  `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
  `destination` TEXT, \
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \
  `context` TEXT, \
  `description` TEXT, \
  `wallet` TEXT \
);', function(err, rows, fields) {
  if (err) {
    console.error(err);
  } else {
    console.log('table Credit created');
  }
});

connection.query('CREATE TABLE Ledger ( \
  `source` TEXT, \
  `amount` REAL, \
  `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
  `wallet` TEXT \
);', function(err, rows, fields) {
  if (err) {
    console.error(err);
  } else {
    console.log('table Ledger created');
  }
});


connection.query('CREATE TABLE Genesis ( \
  `source` TEXT, \
  `amount` REAL, \
  `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
  `wallet` TEXT \
);', function(err, rows, fields) {
  if (err) {
    console.error(err);
  } else {
    console.log('table Genesis created');
  }
});


connection.end();
