const { conn, sql } = require('../connect');

// Lấy bản ghi mới nhất
async function getLatest() {
  const pool = await conn;
  const rs = await pool.request().query(`
    SELECT TOP 1
      Id,
      At,
      Temperature,
      Dust,
      Pressure
    FROM SensorStats
    ORDER BY At DESC;
  `);
  return rs.recordset[0] || null;
}

// Lấy series
async function getSeries(hours = 24) {
  const pool = await conn;
  const rs = await pool.request()
    .input('h', sql.Int, hours)
    .query(`
      SELECT
        Id,
        At,
        Temperature,
        Dust,
        Pressure
      FROM SensorStats
      WHERE At >= DATEADD(HOUR, -@h, GETDATE())
      ORDER BY At ASC;
    `);
  return rs.recordset;
}

module.exports = { getLatest, getSeries };
