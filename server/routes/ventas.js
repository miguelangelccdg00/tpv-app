const express = require("express");
const router = express.Router();
const db = require("../firebase/init");

router.post("/", async (req, res) => {
  try {
    const venta = req.body;
    venta.fecha = new Date().toISOString();
    const ref = await db.collection("ventas").add(venta);
    res.status(201).json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
