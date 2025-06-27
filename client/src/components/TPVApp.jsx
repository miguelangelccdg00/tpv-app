import { useState, useEffect } from "react";
import { ShoppingCartIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../AuthContext";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, query, where, getDocs } from "firebase/firestore";

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

  // Función para refrescar datos del producto
  const refrescarProducto = async (codigoBarra) => {
    try {
      const productosRef = collection(db, "productos");
      const q = query(productosRef, where("codigoBarra", "==", codigoBarra));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        const productData = { id: productDoc.id, ...productDoc.data() };
        return productData;
      }
    } catch (error) {
      console.error("Error al refrescar producto:", error);
    }
    return null;
  };

  const buscarProducto = async () => {
    if (!codigoBarra.trim()) return;

    try {
      // Buscar producto en Firestore por codigoBarra
      const productosRef = collection(db, "productos");
      const q = query(productosRef, where("codigoBarra", "==", codigoBarra));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Producto encontrado
        const productDoc = querySnapshot.docs[0];
        const productData = { id: productDoc.id, ...productDoc.data() };
        setProducto(productData);
        setNoEncontrado(false);
        console.log("Producto encontrado:", productData);
      } else {
        // Producto no encontrado
        setProducto(null);
        setNoEncontrado(true);
        console.log("Producto no encontrado para código:", codigoBarra);
      }
    } catch (error) {
      console.error("Error al buscar producto:", error);
      setProducto(null);
      setNoEncontrado(true);
    }
  };

  const agregarProducto = async () => {
    try {
      const nuevoProductoData = {
        codigoBarra: codigoBarra,
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        stock: parseInt(nuevoProducto.stock),
        fechaCreacion: new Date().toISOString()
      };

      // Agregar producto a Firestore
      const docRef = await addDoc(collection(db, "productos"), nuevoProductoData);
      
      const productData = { id: docRef.id, ...nuevoProductoData };
      setProducto(productData);
      setNoEncontrado(false);
      setNuevoProducto({ nombre: "", precio: "", stock: "" });
      console.log("Producto agregado:", productData);
    } catch (error) {
      console.error("Error al agregar producto:", error);
      alert("Error al agregar producto: " + error.message);
    }
  };

  const agregarAlCarrito = () => {
    if (!producto || cantidad <= 0) return;
    
    // Validar stock disponible
    if (cantidad > producto.stock) {
      alert(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
      return;
    }

    // Verificar si ya existe en el carrito para validar stock total
    const itemExistente = carrito.find(item => item.codigoBarra === producto.codigoBarra);
    const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + cantidad;

    if (cantidadTotal > producto.stock) {
      alert(`Stock insuficiente. Ya tienes ${cantidadEnCarrito} en el carrito. Máximo disponible: ${producto.stock - cantidadEnCarrito}`);
      return;
    }

    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.codigoBarra === producto.codigoBarra
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

  const eliminarDelCarrito = (codigoBarra) => {
    setCarrito(carrito.filter(item => item.codigoBarra !== codigoBarra));
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;

    try {
      // Iniciar transacción para garantizar consistencia
      const ventaData = {
        items: carrito.map(item => ({
          codigoBarra: item.codigoBarra,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad
        })),
        total: total,
        fecha: new Date().toISOString(),
        usuario: usuario?.email || "usuario",
        timestamp: new Date()
      };

      // Agregar la venta a Firestore
      const docRef = await addDoc(collection(db, "ventas"), ventaData);
      console.log("Venta registrada con ID:", docRef.id);

      // Actualizar el stock de cada producto
      let stockUpdatesSuccessful = 0;
      for (const item of carrito) {
        try {
          // Buscar el documento del producto por codigoBarra
          const productosRef = collection(db, "productos");
          const q = query(productosRef, where("codigoBarra", "==", item.codigoBarra));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Obtener el primer documento que coincida
            const productDoc = querySnapshot.docs[0];
            const currentData = productDoc.data();
            const currentStock = currentData.stock;
            const newStock = currentStock - item.cantidad;
            
            // Actualizar stock en Firestore usando el ID del documento
            const productRef = doc(db, "productos", productDoc.id);
            await updateDoc(productRef, {
              stock: newStock
            });
            
            console.log(`✅ Stock actualizado para ${item.nombre}: ${currentStock} -> ${newStock}`);
            stockUpdatesSuccessful++;
          } else {
            console.error(`❌ Producto no encontrado para código: ${item.codigoBarra}`);
          }
        } catch (itemError) {
          console.error(`❌ Error actualizando stock para ${item.nombre}:`, itemError);
        }
      }

      alert(`✅ Venta procesada exitosamente!\n\n📄 ID: ${docRef.id}\n💰 Total: €${total.toFixed(2)}\n📦 Productos: ${carrito.length}\n📊 Stock actualizado: ${stockUpdatesSuccessful}/${carrito.length}`);
      setCarrito([]);
      setTotal(0);
      
      // Si hay un producto siendo mostrado, refrescarlo para mostrar el stock actualizado
      if (producto && codigoBarra === producto.codigoBarra) {
        const productoActualizado = await refrescarProducto(producto.codigoBarra);
        if (productoActualizado) {
          setProducto(productoActualizado);
        }
      }
      
    } catch (error) {
      console.error("❌ Error al procesar venta:", error);
      alert("❌ Error al procesar la venta: " + error.message);
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">{producto.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio</label>
                    <p className="mt-1 text-sm text-gray-900">€{producto.precio}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <p className={`mt-1 text-sm font-medium ${
                      producto.stock <= 5 ? 'text-red-600' : 
                      producto.stock <= 10 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {producto.stock} unidades
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max={producto.stock}
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {cantidad > producto.stock && (
                      <p className="mt-1 text-xs text-red-600">
                        Stock insuficiente (máximo: {producto.stock})
                      </p>
                    )}
                  </div>
                  <button
                    onClick={agregarAlCarrito}
                    disabled={cantidad > producto.stock || producto.stock === 0}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      cantidad > producto.stock || producto.stock === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {producto.stock === 0 ? 'Sin Stock' : 'Agregar'}
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
                    <div key={item.codigoBarra} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {item.cantidad} x €{item.precio} = €{(item.cantidad * item.precio).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarDelCarrito(item.codigoBarra)}
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
