const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'personalweb',
  password: '01Mei2002',
  port: 5432,
});

module.exports = pool;



