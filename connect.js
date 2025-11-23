const sql = require('mssql');
require('dotenv').config();

// Cấu hình SQL Server từ .env
const config = {
  server: process.env.SQL_SERVER,
  port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : undefined,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: process.env.SQL_TRUST_SERVER_CERT === 'true'
  }
};

// Tạo pool kết nối
const conn = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ DB Connection failed:', err);
    throw err;
  });

module.exports = { conn, sql };
