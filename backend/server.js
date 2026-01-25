require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors({
  origin: [
    "https://pkinteriors.netlify.app", // Netlify FE
    "http://localhost:3000"
  ]
}));
app.use(express.json());

/* ---------------- DB CONNECTION ---------------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // REQUIRED for Neon + Render
});

/* ---------------- CREATE TABLE ---------------- */
const initDB = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      owner_phone VARCHAR(15) NOT NULL,
      area TEXT NOT NULL,
      description TEXT NOT NULL,
      measurement NUMERIC NOT NULL,
      rate NUMERIC NOT NULL,
      cost NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ quotations table ready");
  } catch (err) {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  }
};

/* ---------------- POST QUOTATION ---------------- */
app.post("/api/quotation", async (req, res) => {
  const { ownerPhone, items } = req.body;

  if (!ownerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `
        INSERT INTO quotations
        (owner_phone, area, description, measurement, rate, cost)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          ownerPhone,
          item.area,
          item.description,
          Number(item.measurement),
          Number(item.rate),
          Number(item.cost)
        ]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Insert error:", err);
    res.status(500).json({ error: "Insert failed" });
  } finally {
    client.release();
  }
});

/* ---------------- GET QUOTATION ---------------- */
app.get("/api/quotation/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const result = await pool.query(
      `
      SELECT area, description, measurement, rate, cost, created_at
      FROM quotations
      WHERE owner_phone = $1
      ORDER BY created_at ASC
      `,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    const totalCost = result.rows.reduce(
      (sum, row) => sum + Number(row.cost),
      0
    );

    res.json({
      ownerPhone: phone,
      items: result.rows,
      totalCost
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.send("✅ PK Interiors Backend Running");
});

/* ---------------- START SERVER ---------------- */
(async () => {
  await initDB();
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
})();
