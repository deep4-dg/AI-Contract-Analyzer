const pool = require('./config/db');

async function testDB() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("✅ DB Connected:", res.rows);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
}

testDB();