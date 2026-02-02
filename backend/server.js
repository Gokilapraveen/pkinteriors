require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(
  cors({
    origin: ["https://pkinteriors.netlify.app", "http://localhost:3000"],
  })
);
app.use(express.json());

/* -------------------- DATABASE -------------------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* -------------------- INIT DATABASE -------------------- */
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        type VARCHAR(20) CHECK (type IN ('OWNER', 'ENGINEER')) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INT REFERENCES quotations(id) ON DELETE CASCADE,
        area TEXT NOT NULL,
        description TEXT,
        measurement NUMERIC NOT NULL,
        rate NUMERIC NOT NULL,
        cost NUMERIC NOT NULL
      );
    `);

    console.log("✅ Database tables ready");
  } catch (err) {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  }
};

/* -------------------- CUSTOMER APIs -------------------- */

/* ADD CUSTOMER */
app.post("/api/customers", async (req, res) => {
  const { name, phone, type } = req.body;

  if (!name || !phone || !type) {
    return res.status(400).json({ error: "Missing customer data" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, phone, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, phone, type]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Add customer error:", err);
    res.status(500).json({ error: "Customer creation failed" });
  }
});

/* FETCH CUSTOMERS */
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone, type FROM customers ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch customers error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------- QUOTATION APIs -------------------- */

/* CREATE QUOTATION WITH ITEMS */
app.post("/api/quotation", async (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quotationRes = await client.query(
      `INSERT INTO quotations (customer_id)
       VALUES ($1) RETURNING id`,
      [customer_id]
    );

    const quotationId = quotationRes.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items
         (quotation_id, area, description, measurement, rate, cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          quotationId,
          item.area,
          item.description,
          item.measurement,
          item.rate,
          item.cost,
        ]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, quotation_id: quotationId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Create quotation error:", err);
    res.status(500).json({ error: "Quotation creation failed" });
  } finally {
    client.release();
  }
});

/* FETCH ALL QUOTATIONS (ADMIN VIEW) */
app.get("/api/fetchquotations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        q.id AS quotation_id,
        c.name,
        c.phone,
        c.type,
        qi.*
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN quotation_items qi ON qi.quotation_id = q.id
      ORDER BY q.id DESC
    `);

    const grouped = {};

    result.rows.forEach(row => {
      if (!grouped[row.quotation_id]) {
        grouped[row.quotation_id] = {
          quotation_id: row.quotation_id,
          customer_name: row.name,
          customer_phone: row.phone,
          customer_type: row.type,
          total_cost: 0,
          items: [],
        };
      }

      grouped[row.quotation_id].items.push({
        id: row.id,
        area: row.area,
        description: row.description,
        measurement: row.measurement,
        rate: row.rate,
        cost: row.cost,
      });

      grouped[row.quotation_id].total_cost += Number(row.cost);
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("❌ Fetch quotations error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* UPDATE QUOTATION ITEM */
app.put("/api/quotation/item/:id", async (req, res) => {
  const { id } = req.params;
  const { area, description, measurement, rate, cost } = req.body;

  try {
    const result = await pool.query(
      `UPDATE quotation_items
       SET area=$1, description=$2, measurement=$3, rate=$4, cost=$5
       WHERE id=$6`,
      [area, description, measurement, rate, cost, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Update item error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* DELETE QUOTATION ITEM */
app.delete("/api/quotation/item/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM quotation_items WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete item error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.send("✅ PK Interiors Backend Running");
});

/* -------------------- START SERVER -------------------- */
(async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
