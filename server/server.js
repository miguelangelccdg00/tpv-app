const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const productosRouter = require('./routes/productos');
app.use('/api/productos', productosRouter);
const ventasRouter = require('./routes/ventas');
app.use('/api/ventas', ventasRouter);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
