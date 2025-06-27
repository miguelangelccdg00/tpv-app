import { useState, useEffect } from "react";
import { ShoppingCartIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../AuthContext";

export default function TPVApp() {
  const { usuario, logout } = useAuth();
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

  // Calcular total cuando cambie el carrito
  useEffect(() => {
    const nuevoTotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    setTotal(nuevoTotal);
  }, [carrito]);

  const buscarProducto = async () => {
    if (!codigoBarra.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/productos/${codigoBarra}`);
      if (response.ok) {
        const data = await response.json();
        setProducto(data);
        setNoEncontrado(false);
      } else {
        setProducto(null);
        setNoEncontrado(true);
      }
    } catch (error) {
      console.error("Error al buscar producto:", error);
      setProducto(null);
      setNoEncontrado(true);
    }
  };

  const agregarProducto = async () => {
    try {
      const response = await fetch("http://localhost:3000/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigoBarra,
          ...nuevoProducto,
          precio: parseFloat(nuevoProducto.precio),
          stock: parseInt(nuevoProducto.stock),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducto(data);
        setNoEncontrado(false);
        setNuevoProducto({ nombre: "", precio: "", stock: "" });
      }
    } catch (error) {
      console.error("Error al agregar producto:", error);
    }
  };

  const agregarAlCarrito = () => {
    if (!producto || cantidad <= 0) return;

    const itemExistente = carrito.find(item => item.codigo === producto.codigo);
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.codigo === producto.codigo
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad }]);
    }

    // Limpiar
    setProducto(null);
    setCodigoBarra("");
    setCantidad(1);
    setNoEncontrado(false);
  };

  const eliminarDelCarrito = (codigo) => {
    setCarrito(carrito.filter(item => item.codigo !== codigo));
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;

    try {
      const response = await fetch("http://localhost:3000/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito,
          total,
          fecha: new Date().toISOString(),
          usuario: usuario?.email || "usuario",
        }),
      });

      if (response.ok) {
        alert("Venta procesada exitosamente");
        setCarrito([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error al procesar venta:", error);
      alert("Error al procesar la venta");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <ShoppingCartIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">TPV Sistema</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Hola, {usuario?.email || "Usuario"}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <UserIcon className="h-4 w-4 mr-1" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área de escaneo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Escanear Producto</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={codigoBarra}
                  onChange={(e) => setCodigoBarra(e.target.value)}
                  placeholder="Código de barras..."
                  className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && buscarProducto()}
                />
                <button
                  onClick={buscarProducto}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  Buscar
                </button>
              </div>
            </div>

            {/* Producto encontrado */}
            {producto && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Producto Encontrado</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">{producto.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio</label>
                    <p className="mt-1 text-sm text-gray-900">€{producto.precio}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={agregarAlCarrito}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {/* Producto no encontrado */}
            {noEncontrado && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Producto No Encontrado</h3>
                <p className="text-sm text-gray-600 mb-4">
                  El código {codigoBarra} no existe. ¿Deseas agregar este producto?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={nuevoProducto.nombre}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                    placeholder="Nombre del producto"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={nuevoProducto.precio}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                    placeholder="Precio"
                    step="0.01"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={nuevoProducto.stock}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
                    placeholder="Stock"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={agregarProducto}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Carrito */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Carrito de Compras</h2>
            
            {carrito.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay productos en el carrito</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {carrito.map((item) => (
                    <div key={item.codigo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {item.cantidad} x €{item.precio} = €{(item.cantidad * item.precio).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarDelCarrito(item.codigo)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">€{total.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={procesarVenta}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Procesar Venta
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
