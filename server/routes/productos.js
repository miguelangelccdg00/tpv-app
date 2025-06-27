const express = require('express');
const router = express.Router();
const db = require('../firebase/init');

// Crear producto
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('productos').add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('productos').get();
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar producto por código de barra
router.get('/buscar/:codigoBarra', async (req, res) => {
  try {
    const { codigoBarra } = req.params;
    const query = db.collection('productos').where('codigoBarra', '==', codigoBarra);
    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    const producto = snapshot.docs[0].data();
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
