require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- PostgreSQL Pool ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon requirement
});

// ---------- CREATE TABLE (GUARANTEED) ----------
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS public.quotations (
      id SERIAL,
      owner_phone VARCHAR(15) NOT NULL,
      area TEXT NOT NULL,
      description TEXT NOT NULL,
      measurement NUMERIC NOT NULL,
      rate NUMERIC NOT NULL,
      cost NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (owner_phone, id)
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Table public.quotations ready");
  } catch (err) {
    console.error("❌ Failed to create table:", err);
    process.exit(1); // stop server if DB broken
  }
};

// ---------- POST API ----------
app.post("/api/quotation", async (req, res) => {
  try {
    const { ownerPhone, items } = req.body;

    if (!ownerPhone) {
      return res.status(400).json({ error: "Owner phone number required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items must be a non-empty array" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const item of items) {
        await client.query(
          `
          INSERT INTO public.quotations
          (owner_phone, area, description, measurement, rate, cost)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            ownerPhone,
            item.area,
            item.description,
            Number(item.measurement),
            Number(item.rate),
            Number(item.cost),
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
  } catch (err) {
    console.error("❌ API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// ---------- GET QUOTATION BY OWNER PHONE ----------
app.get("/api/quotation/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
  
      if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
      }
  
      const result = await pool.query(
        `
        SELECT 
          owner_phone,
          area,
          description,
          measurement,
          rate,
          cost,
          created_at
        FROM public.quotations
        WHERE owner_phone = $1
        ORDER BY created_at ASC
        `,
        [phone]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No quotation found" });
      }
  
      res.json({
        ownerPhone: phone,
        items: result.rows,
        totalCost: result.rows.reduce((sum, r) => sum + Number(r.cost), 0),
      });
    } catch (err) {
      console.error("Fetch error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });
  
// ---------- START SERVER (AFTER TABLE CREATION) ----------
(async () => {
  await createTable();

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
