#!/usr/bin/env node

var config = {};
config.storage  = 'credit.db';
config.dialect  = 'mysql';
config.host     = 'localhost';
config.database = 'webcredits';
config.username = 'root';
config.password = '';
config.wallet   = 'urn:wallet:default';

module.exports = config;
