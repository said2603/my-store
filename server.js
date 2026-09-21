const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات PostgreSQL عبر Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// إنشاء جدول المنتجات تلقائياً إذا لم يكن موجوداً
pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC NOT NULL,
    category VARCHAR(100),
    image TEXT,
    description TEXT,
    stock INT DEFAULT 0
  );
`);

// جلب المنتجات من قاعدة البيانات
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة منتج جديد
app.post('/api/products', async (req, res) => {
  const { name, price, category, image, description, stock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, category, image, description, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, price, category, image, description, stock]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// عرض ملف HTML الرئيسي
app.use(express.static(__dirname));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
