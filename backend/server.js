require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(
  cors({
    origin: [
      "https://pkinteriors.netlify.app",
      "http://localhost:3000",
    ],
  })
);
app.use(express.json());

/* -------------------- DB -------------------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* -------------------- INIT TABLE -------------------- */
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

/* -------------------- CREATE (PHONE KEY) -------------------- */
/*
  POST /api/quotation
  {
    ownerPhone: "9876543210",
    items: [ { area, description, measurement, rate, cost } ]
  }
*/
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
          item.measurement,
          item.rate,
          item.cost,
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

/* -------------------- FETCH ALL (GROUPED BY PHONE) -------------------- */
app.get("/api/fetchquotations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM quotations
      ORDER BY owner_phone, created_at
    `);

    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.owner_phone]) {
        acc[row.owner_phone] = {
          owner_phone: row.owner_phone,
          items: [],
          total_cost: 0,
        };
      }

      acc[row.owner_phone].items.push(row);
      acc[row.owner_phone].total_cost += Number(row.cost);
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------- FETCH BY PHONE (KEY API) -------------------- */
app.get("/api/quotation/:phone", async (req, res) => {
  const { phone } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM quotations
      WHERE owner_phone = $1
      ORDER BY created_at
      `,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No quotations found" });
    }

    const total = result.rows.reduce(
      (sum, r) => sum + Number(r.cost),
      0
    );

    res.json({
      owner_phone: phone,
      total_cost: total,
      items: result.rows,
    });
  } catch (err) {
    console.error("❌ Fetch by phone error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------- UPDATE SINGLE ROW (PHONE + ID) -------------------- */
app.put("/api/quotation/:phone/:id", async (req, res) => {
  const { phone, id } = req.params;
  const { area, description, measurement, rate, cost } = req.body;

  if (!area || !description || !measurement || !rate || !cost) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE quotations
      SET area = $1,
          description = $2,
          measurement = $3,
          rate = $4,
          cost = $5
      WHERE id = $6 AND owner_phone = $7
      `,
      [area, description, measurement, rate, cost, id, phone]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Row not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- DELETE SINGLE ROW (PHONE + ID) -------------------- */
app.delete("/api/quotation/:phone/:id", async (req, res) => {
  const { phone, id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM quotations
      WHERE id = $1 AND owner_phone = $2
      `,
      [id, phone]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Row not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* -------------------- DELETE ALL FOR A PHONE -------------------- */
app.delete("/api/quotation/:phone", async (req, res) => {
  const { phone } = req.params;

  try {
    await pool.query(
      `DELETE FROM quotations WHERE owner_phone = $1`,
      [phone]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete phone error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* -------------------- HEALTH -------------------- */
app.get("/", (req, res) => {
  res.send("✅ PK Interiors Backend Running");
});

/* -------------------- START -------------------- */
(async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
