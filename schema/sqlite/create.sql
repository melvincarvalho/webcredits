CREATE TABLE CREDIT (
  '@id' TEXT,
  'source' TEXT,
  'amount' REAL,
  'currency' TEXT DEFAULT 'https://w3id.org/cc#bit',
  'destination' TEXT,
  'timestamp' TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  'context' TEXT,
  'description' TEXT,
  'wallet' TEXT
);

CREATE TABLE LEDGER (
  'source' TEXT,
  'amount' REAL,
  'wallet' TEXT
);
