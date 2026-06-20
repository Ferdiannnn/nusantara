const { Pool } = require('pg');
require('dotenv').config();

// Membuat pool koneksi menggunakan variabel dari file .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Tes koneksi ke database saat aplikasi pertama kali berjalan
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Gagal terhubung ke PostgreSQL:', err.stack);
  }
  console.log('Berhasil terhubung ke database PostgreSQL!');
  release(); 
});

module.exports = pool;
