CREATE TABLE Credit (
  `@id` TEXT,
  `source` TEXT,
  `amount` REAL,
  `currency` VARCHAR(255) DEFAULT 'https://w3id.org/cc#bit',
  `destination` TEXT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `context` TEXT,
  `description` TEXT,
  `wallet` TEXT,
   KEY `timestamp_index` (`timestamp`)
);

CREATE TABLE Ledger (
  `source` TEXT,
  `amount` REAL,
  `currency` VARCHAR(255) DEFAULT 'https://w3id.org/cc#bit',
  `wallet` TEXT
);

CREATE TABLE Genesis (
  `source` TEXT,
  `amount` REAL,
  `currency` VARCHAR(255) DEFAULT 'https://w3id.org/cc#bit',
  `wallet` TEXT
);
