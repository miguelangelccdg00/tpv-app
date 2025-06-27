import { useState, useEffect } from "react";
import { ShoppingCartIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function App() {
  const [codigoBarra, setCodigoBarra] = useState("");
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    stock: "",
  });
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);

  const buscarProducto = async () => {
    if (!codigoBarra.trim()) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/productos/buscar/${codigoBarra}`);
      if (!res.ok) throw new Error("No encontrado");
      const data = await res.json();
      setProducto(data);
      setNoEncontrado(false);
    } catch (err) {
      setProducto(null);
      setNoEncontrado(true);
    }
  };

  const handleSubmitNuevo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoProducto, codigoBarra }),
      });
      const data = await res.json();
      setProducto({ ...nuevoProducto, codigoBarra });
      setNoEncontrado(false);
      setNuevoProducto({ nombre: "", precio: "", stock: "" });
    } catch (error) {
      console.error("Error al crear producto:", error);
    }
  };

  const agregarAlCarrito = (producto, cantidadAAgregar = 1) => {
    const existe = carrito.find(p => p.codigoBarra === producto.codigoBarra);
    if (existe) {
      setCarrito(carrito.map(p =>
        p.codigoBarra === producto.codigoBarra
          ? { ...p, cantidad: p.cantidad + cantidadAAgregar }
          : p
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: cantidadAAgregar }]);
    }
    setCodigoBarra("");
    setProducto(null);
    setCantidad(1);
  };

  const eliminarDelCarrito = (codigoBarra) => {
    setCarrito(carrito.filter(p => p.codigoBarra !== codigoBarra));
  };

  const modificarCantidad = (codigoBarra, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(codigoBarra);
    } else {
      setCarrito(carrito.map(p =>
        p.codigoBarra === codigoBarra
          ? { ...p, cantidad: nuevaCantidad }
          : p
      ));
    }
  };

  const procesarVenta = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: carrito, total }),
      });
      const data = await res.json();
      setCarrito([]);
      setTotal(0);
    } catch (error) {
      console.error("Error al procesar venta:", error);
    }
  };

  useEffect(() => {
    const nuevoTotal = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    setTotal(nuevoTotal);
  }, [carrito]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingCartIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">TPV Sistema</h1>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel izquierdo - Scanner y productos */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Scanner */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Escáner de Productos</h2>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Escanea o escribe código de barras"
                    value={codigoBarra}
                    onChange={(e) => setCodigoBarra(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscarProducto()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    autoFocus
                  />
                </div>
                <button
                  onClick={buscarProducto}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Buscar
                </button>
              </div>
            </div>

            {/* Producto encontrado */}
            {producto && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Producto Encontrado</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    En stock
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p className="text-lg text-gray-900">{producto.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Precio</p>
                    <p className="text-lg font-semibold text-green-600">${producto.precio}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Stock disponible</p>
                    <p className="text-lg text-gray-900">{producto.stock} unidades</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max={producto.stock}
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => agregarAlCarrito(producto, cantidad)}
                      disabled={cantidad > producto.stock || cantidad <= 0}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Agregar al carrito
                    </button>
                  </div>
                </div>

                {cantidad > producto.stock && (
                  <p className="text-red-600 text-sm mt-2">
                    Cantidad no disponible. Stock máximo: {producto.stock}
                  </p>
                )}
              </div>
            )}

            {/* Producto no encontrado */}
            {noEncontrado && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Producto No Encontrado</h3>
                <p className="text-gray-600 mb-4">¿Deseas agregar este producto al inventario?</p>
                
                <form onSubmit={handleSubmitNuevo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        placeholder="Nombre del producto"
                        value={nuevoProducto.nombre}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={nuevoProducto.precio}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={nuevoProducto.stock}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar Producto
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Panel derecho - Carrito */}
          <div className="bg-white rounded-lg shadow-sm border h-fit">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCartIcon className="h-5 w-5" />
                Carrito de Venta
                {carrito.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {carrito.length} productos
                  </span>
                )}
              </h2>
            </div>

            {carrito.length === 0 ? (
              <div className="p-6 text-center">
                <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">El carrito está vacío</p>
                <p className="text-sm text-gray-400">Escanea productos para comenzar</p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-0">
                    {carrito.map((item, index) => (
                      <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{item.nombre}</h4>
                          <button
                            onClick={() => eliminarDelCarrito(item.codigoBarra)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => modificarCantidad(item.codigoBarra, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-500">× ${item.precio}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${(item.precio * item.cantidad).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">${total.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={procesarVenta}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Confirmar Venta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;