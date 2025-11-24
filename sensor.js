const { conn, sql } = require('./connect');

function randomAround(base, delta) {
  return base + (Math.random() * 2 - 1) * delta;
}

async function insertFakeReading() {
  try {
    const pool = await conn;

    const temp = randomAround(28, 3);
    const dust = randomAround(15, 5);
    const press = randomAround(1010, 8);

    const now = new Date(); //  giờ đúng trên máy tính

    await pool.request()
      .input('t',  sql.Float, temp)
      .input('d',  sql.Float, dust)
      .input('p',  sql.Float, press)
      .input('at', sql.DateTime2, now)   //  GỬI THẲNG now VÀO CỘT At
      .query(`
        INSERT INTO SensorStats (Temperature, Dust, Pressure, At)
        VALUES (@t, @d, @p, @at);
      `);

    console.log(
      `[OK] Inserted SensorStats at ` +
      `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} ` +
      `${now.toLocaleDateString('vi-VN')} -> ` +
      `T=${temp.toFixed(2)}°C, Dust=${dust.toFixed(2)}µg/m³, P=${press.toFixed(2)}hPa`
    );
  } catch (err) {
    console.error('[ERROR] insertFakeReading:', err);
  }
}

insertFakeReading();
setInterval(insertFakeReading, 60 * 1000);
