require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({ origin: ["http://localhost:3000"] }));
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

/* -------------------- AUTH -------------------- */
const generateToken = (user) =>
  jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

const authMiddleware = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ error: "Forbidden" });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* -------------------- INIT DB -------------------- */
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone VARCHAR(15) UNIQUE NOT NULL,
      type VARCHAR(20) CHECK (type IN ('OWNER', 'ENGINEER')) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
      gst_percent NUMERIC DEFAULT 18,
      gst_amount NUMERIC DEFAULT 0,
      grand_total NUMERIC DEFAULT 0,
      status VARCHAR(20) CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')) DEFAULT 'DRAFT',
      payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING','PAID')) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS quotation_items (
      id SERIAL PRIMARY KEY,
      quotation_id INT REFERENCES quotations(id) ON DELETE CASCADE,
      area TEXT NOT NULL,
      description TEXT,
      measurement NUMERIC NOT NULL,
      rate NUMERIC NOT NULL,
      cost NUMERIC NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      quotation_id INT REFERENCES quotations(id),
      invoice_no TEXT UNIQUE,
      invoice_date DATE DEFAULT CURRENT_DATE,
      total NUMERIC,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ DB tables ready");
};

/* -------------------- LOGIN -------------------- */
app.post("/api/login", (req, res) => {
  const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "supervisor", password: "super123", role: "supervisor" }
  ];
  const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
  if (!user) return res.status(401).json({ error: "Invalid login" });
  res.json({ token: generateToken(user), role: user.role, username: user.username });
});

/* -------------------- CUSTOMER APIs -------------------- */
app.post("/api/customers", authMiddleware(["admin"]), async (req, res) => {
  const { name, phone, type } = req.body;
  if (!name || !phone || !type) return res.status(400).json({ error: "Missing data" });
  const result = await pool.query(
    "INSERT INTO customers(name,phone,type) VALUES($1,$2,$3) RETURNING *",
    [name, phone, type]
  );
  res.json(result.rows[0]);
});
app.get("/api/customers", authMiddleware(["admin","supervisor"]), async (req, res) => {
  const result = await pool.query("SELECT id,name,phone,type FROM customers ORDER BY name");
  res.json(result.rows);
});

/* -------------------- QUOTATION APIs -------------------- */
app.post("/api/quotation", authMiddleware(["admin","supervisor"]), async (req,res)=>{
  const { customer_id, items } = req.body;
  if(!customer_id || !items?.length) return res.status(400).json({error:"Invalid"});
  const subtotal = items.reduce((s,i)=>s+Number(i.cost),0);
  const gst_percent = 18;
  const gst_amount = subtotal*gst_percent/100;
  const grand_total = subtotal + gst_amount;
  const client = await pool.connect();
  try{
    await client.query("BEGIN");
    const qRes = await client.query(
      "INSERT INTO quotations(customer_id,gst_percent,gst_amount,grand_total) VALUES($1,$2,$3,$4) RETURNING id",
      [customer_id,gst_percent,gst_amount,grand_total]
    );
    const qId = qRes.rows[0].id;
    for(const i of items){
      await client.query(
        "INSERT INTO quotation_items(quotation_id,area,description,measurement,rate,cost) VALUES($1,$2,$3,$4,$5,$6)",
        [qId,i.area,i.description,i.measurement,i.rate,i.cost]
      );
    }
    await client.query("COMMIT");
    res.json({success:true,quotation_id:qId});
  }catch(err){await client.query("ROLLBACK");console.error(err);res.status(500).json({error:"Failed"});}
  finally{client.release();}
});

/* Fetch all quotations (admin view) */
app.get("/api/fetchquotations", authMiddleware(["admin","supervisor"]), async (req,res)=>{
  const result = await pool.query(`
    SELECT q.id AS quotation_id, c.name,c.phone,c.type,q.gst_percent,q.gst_amount,q.grand_total,q.status,q.payment_status,qi.*
    FROM quotations q
    JOIN customers c ON q.customer_id=c.id
    JOIN quotation_items qi ON qi.quotation_id=q.id
    ORDER BY q.id DESC
  `);
  const grouped = {};
  result.rows.forEach(r=>{
    if(!grouped[r.quotation_id]){
      grouped[r.quotation_id]={quotation_id:r.quotation_id,customer_name:r.name,customer_phone:r.phone,customer_type:r.type,
        gst_percent:r.gst_percent,gst_amount:r.gst_amount,grand_total:r.grand_total,status:r.status,payment_status:r.payment_status,items:[]};
    }
    grouped[r.quotation_id].items.push({id:r.id,area:r.area,description:r.description,measurement:r.measurement,rate:r.rate,cost:r.cost});
  });
  res.json(Object.values(grouped));
});

/* Approve / Reject quotation */
app.put("/api/quotation/:id/approve", authMiddleware(["admin"]), async (req,res)=>{
  await pool.query("UPDATE quotations SET status='APPROVED' WHERE id=$1",[req.params.id]);
  res.json({success:true});
});
app.put("/api/quotation/:id/reject", authMiddleware(["admin"]), async (req,res)=>{
  await pool.query("UPDATE quotations SET status='REJECTED' WHERE id=$1",[req.params.id]);
  res.json({success:true});
});

/* Mark payment */
app.put("/api/quotation/:id/pay", authMiddleware(["admin"]), async (req,res)=>{
  await pool.query("UPDATE quotations SET payment_status='PAID' WHERE id=$1",[req.params.id]);
  res.json({success:true});
});

/* Generate PDF */
const generatePDF = (quotation,res)=>{
  const doc = new PDFDocument();
  res.setHeader("Content-Type","application/pdf");
  doc.pipe(res);
  doc.fontSize(18).text("PK Interiors – Quotation / Invoice");
  doc.moveDown();
  doc.text(`Customer: ${quotation.customer_name}`);
  doc.text(`Type: ${quotation.customer_type}`);
  doc.text(`Phone: ${quotation.customer_phone}`);
  doc.text(`Status: ${quotation.status}`);
  doc.text(`Payment: ${quotation.payment_status}`);
  doc.moveDown();
  quotation.items.forEach((item,i)=>{
    doc.text(`${i+1}. ${item.area} | ${item.description} | ${item.measurement} x ${item.rate} = ₹${item.cost}`);
  });
  doc.moveDown();
  doc.text(`GST ${quotation.gst_percent}%: ₹${quotation.gst_amount}`);
  doc.text(`Total: ₹${quotation.grand_total}`);
  doc.end();
};

app.get("/api/quotation/:id/pdf", authMiddleware(["admin","supervisor"]), async (req,res)=>{
  const q = await pool.query(`
    SELECT q.id AS quotation_id, c.name,c.phone,c.type,q.gst_percent,q.gst_amount,q.grand_total,q.status,q.payment_status,qi.*
    FROM quotations q
    JOIN customers c ON q.customer_id=c.id
    JOIN quotation_items qi ON qi.quotation_id=q.id
    WHERE q.id=$1
  `,[req.params.id]);
  if(!q.rows.length) return res.status(404).json({error:"Not found"});
  const grouped = {customer_name:q.rows[0].name,customer_phone:q.rows[0].phone,customer_type:q.rows[0].type,
    gst_percent:q.rows[0].gst_percent,gst_amount:q.rows[0].gst_amount,grand_total:q.rows[0].grand_total,
    status:q.rows[0].status,payment_status:q.rows[0].payment_status,items:[]};
  q.rows.forEach(r=>grouped.items.push({area:r.area,description:r.description,measurement:r.measurement,rate:r.rate,cost:r.cost}));
  generatePDF(grouped,res);
});

app.get("/",(req,res)=>res.send("✅ Backend Running"));

(async()=>{await initDB();app.listen(PORT,()=>console.log(`🚀 Server running on port ${PORT}`))})();
