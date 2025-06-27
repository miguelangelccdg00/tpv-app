import { useState, useEffect } from "react";
import { ShoppingCartIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../../../AuthContext";
import { useSecureData } from "../../../contexts/SecureDataContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function TPVPage() {
  const { usuario, logout } = useAuth();
  const { secureGetDocs, secureAddDoc, secureUpdateDoc } = useSecureData();
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
  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    esVentaAnonima: true
  });

  // Calcular total cuando cambie el carrito
  useEffect(() => {
    const nuevoTotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    setTotal(nuevoTotal);
  }, [carrito]);

  // Función para refrescar datos del producto con contexto seguro
  const refrescarProducto = async (codigoBarra) => {
    try {
      // Buscar solo en productos del usuario actual
      const productos = await secureGetDocs('productos', []);
      const producto = productos.find(p => p.codigoBarra === codigoBarra);
      
      return producto || null;
    } catch (error) {
      console.error("Error al refrescar producto:", error);
      return null;
    }
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
    const cantidadNumerica = parseInt(cantidad) || 1;
    
    if (!producto || cantidadNumerica <= 0) return;
    
    // Validar stock disponible
    if (cantidadNumerica > producto.stock) {
      alert(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
      return;
    }

    // Verificar si ya existe en el carrito para validar stock total
    const itemExistente = carrito.find(item => item.codigoBarra === producto.codigoBarra);
    const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + cantidadNumerica;

    if (cantidadTotal > producto.stock) {
      alert(`Stock insuficiente. Ya tienes ${cantidadEnCarrito} en el carrito. Máximo disponible: ${producto.stock - cantidadEnCarrito}`);
      return;
    }

    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.codigoBarra === producto.codigoBarra
          ? { ...item, cantidad: item.cantidad + cantidadNumerica }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: cantidadNumerica }]);
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

  // Función para generar ticket de impresión
  const generarTicketImpresion = (ventaData, ventaId) => {
    const fecha = new Date();
    const fechaFormateada = fecha.toLocaleDateString('es-ES');
    const horaFormateada = fecha.toLocaleTimeString('es-ES');
    
    // Obtener configuración de impresión desde localStorage
    const configImpresion = JSON.parse(localStorage.getItem('configImpresion') || '{}');
    const {
      nombreTienda = 'TPV SISTEMA',
      logoTienda = '',
      mensajePie = '¡Gracias por su compra!\nConserve este ticket como\ncomprobante de su compra.',
      anchoTicket = 280,
      cortarPapel = true
    } = configImpresion;

    // Generar contenido HTML para el ticket
    const logoHTML = logoTienda ? `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${logoTienda}" alt="Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;" onError="this.style.display='none'"/>
      </div>
    ` : '';

    const ticketHTML = `
      <div style="width: ${anchoTicket}px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; text-align: center;">
        ${logoHTML}
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;">
          <h2 style="margin: 5px 0; font-size: 16px; font-weight: bold;">${nombreTienda}</h2>
        </div>
        
        <div style="text-align: left; margin: 10px 0;">
          <div>Fecha: ${fechaFormateada}</div>
          <div>Hora: ${horaFormateada}</div>
          <div>Ticket: #${ventaId.slice(0, 8).toUpperCase()}</div>
          <div>Cajero: ${usuario?.email || 'Usuario'}</div>
        </div>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="font-weight: bold; margin: 5px 0;">PRODUCTOS:</div>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        
        ${ventaData.items.map(item => {
          const nombreTruncado = item.nombre.length > 25 ? 
            item.nombre.substring(0, 22) + '...' : 
            item.nombre;
          
          return `
            <div style="text-align: left; margin: 3px 0;">
              <div style="font-weight: bold;">${nombreTruncado}</div>
              <div style="display: flex; justify-content: space-between;">
                <span>${item.cantidad} x €${item.precio.toFixed(2)}</span>
                <span style="font-weight: bold;">€${item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          `;
        }).join('')}
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        
        <div style="text-align: left; margin: 5px 0;">
          <div>TOTAL PRODUCTOS: ${ventaData.items.length}</div>
          <div>TOTAL UNIDADES: ${ventaData.items.reduce((sum, item) => sum + item.cantidad, 0)}</div>
        </div>
        
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>
        
        <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
          TOTAL A PAGAR: €${ventaData.total.toFixed(2)}
        </div>
        
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>
        
        <div style="margin: 15px 0; white-space: pre-line;">
          ${mensajePie}
        </div>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="font-size: 10px; margin: 5px 0;">
          TPV Sistema v1.0
        </div>
        
        ${cortarPapel ? '<div style="margin-top: 30px;"></div>' : ''}
      </div>
    `;

    return ticketHTML;
  };

  // Función para imprimir ticket
  const imprimirTicket = (ticketHTML) => {
    // Obtener configuración de impresión
    const configImpresion = JSON.parse(localStorage.getItem('configImpresion') || '{}');
    const { impresoraSeleccionada = 'Impresora por defecto', anchoTicket = 280 } = configImpresion;

    // Crear una ventana nueva para impresión
    const ventanaImpresion = window.open('', '_blank', `width=${anchoTicket + 50},height=700`);
    
    if (!ventanaImpresion) {
      alert('⚠️ No se pudo abrir la ventana de impresión.\nVerifique que no esté bloqueada por el navegador.');
      return;
    }
    
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Ticket de Venta</title>
          <style>
            body {
              margin: 0;
              padding: 10px;
              background: white;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 5px;
              }
              
              @page {
                margin: 0;
                size: ${anchoTicket}px auto;
              }
            }
            
            .no-print {
              display: block;
              text-align: center;
              margin: 10px 0;
              padding: 10px;
              background: #f0f0f0;
              border: 1px solid #ccc;
              border-radius: 5px;
            }
            
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <p><strong>🖨️ Imprimiendo en:</strong> ${impresoraSeleccionada}</p>
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
              🖨️ Imprimir Ahora
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
              ❌ Cerrar
            </button>
          </div>
          
          ${ticketHTML}
        </body>
      </html>
    `);
    
    ventanaImpresion.document.close();
    
    // Auto-imprimir después de cargar
    setTimeout(() => {
      ventanaImpresion.print();
    }, 1000);
  };

  // Función para preguntar si quiere imprimir ticket
  const preguntarImprimirTicket = (ventaData, ventaId) => {
    const quiereImprimir = window.confirm(
      `🖨️ ¿Desea imprimir el ticket de la venta?\n\n` +
      `Ticket: #${ventaId.slice(0, 8).toUpperCase()}\n` +
      `Total: €${ventaData.total.toFixed(2)}\n\n` +
      `Haga clic en "Aceptar" para imprimir el ticket\n` +
      `o "Cancelar" para continuar sin imprimir.`
    );

    if (quiereImprimir) {
      const ticketHTML = generarTicketImpresion(ventaData, ventaId);
      imprimirTicket(ticketHTML);
    }
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

      alert(`🎉 ¡VENTA PROCESADA EXITOSAMENTE! 🎉\n\n` +
            `🧾 ID de Venta: #${docRef.id.slice(0, 8).toUpperCase()}\n` +
            `💰 Total: €${total.toFixed(2)}\n` +
            `📦 Productos: ${carrito.length} artículos diferentes\n` +
            `📊 Unidades: ${carrito.reduce((sum, item) => sum + item.cantidad, 0)} unidades\n` +
            `✅ Stock actualizado: ${stockUpdatesSuccessful}/${carrito.length} productos\n\n` +
            `¡Gracias por usar nuestro sistema TPV!`);
      
      // Preguntar si quiere imprimir ticket
      preguntarImprimirTicket(ventaData, docRef.id);
      
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
              
              
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área de escaneo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-6">
              <div className="flex items-center mb-4">
                <MagnifyingGlassIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Escanear Producto</h2>
              </div>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={codigoBarra}
                    onChange={(e) => setCodigoBarra(e.target.value)}
                    placeholder="Escanea o escribe el código de barras..."
                    className="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    onKeyPress={(e) => e.key === "Enter" && buscarProducto()}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">📱</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={buscarProducto}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-150 hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>Buscar</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Producto encontrado */}
            {producto && (
              <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-green-800">✅ Producto Encontrado</h3>
                </div>
                
                {/* Información del producto más visual */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-600 font-medium">PRODUCTO</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{producto.nombre}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-600 font-medium">PRECIO</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">€{producto.precio.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-600 font-medium">STOCK</p>
                        <p className={`text-xl font-bold mt-1 ${
                          producto.stock <= 5 ? 'text-red-600' : 
                          producto.stock <= 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {producto.stock}
                        </p>
                        <p className="text-xs text-gray-500">unidades</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selector de cantidad mejorado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={producto.stock}
                        value={cantidad}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || value === '0') {
                            setCantidad('');
                          } else {
                            setCantidad(parseInt(value) || 1);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseInt(e.target.value) <= 0) {
                            setCantidad(1);
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            return;
                          }
                          if (e.key === 'Enter' && cantidad > 0 && cantidad <= producto.stock) {
                            agregarAlCarrito();
                          }
                        }}
                        placeholder="1"
                        className="w-20 px-3 py-2 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {cantidad > producto.stock && (
                      <p className="text-sm text-red-600 font-medium">
                        ⚠️ Stock insuficiente (máx: {producto.stock})
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={agregarAlCarrito}
                    disabled={(parseInt(cantidad) || 1) > producto.stock || producto.stock === 0}
                    className={`px-8 py-3 font-bold text-lg rounded-lg shadow-lg transform transition-all duration-150 hover:scale-105 active:scale-95 ${
                      (parseInt(cantidad) || 1) > producto.stock || producto.stock === 0
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <PlusIcon className="h-5 w-5" />
                      <span>{producto.stock === 0 ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Producto no encontrado */}
            {noEncontrado && (
              <div className="bg-white rounded-lg shadow-lg border-l-4 border-yellow-500 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-yellow-800">⚠️ Producto No Encontrado</h3>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-medium mb-2">
                    El código <span className="font-bold bg-yellow-200 px-2 py-1 rounded">{codigoBarra}</span> no existe en el sistema.
                  </p>
                  <p className="text-yellow-700">
                    ¿Deseas crear este producto nuevo?
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={nuevoProducto.nombre}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                    placeholder="Nombre del producto"
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={nuevoProducto.precio}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                    placeholder="Precio (€)"
                    step="0.01"
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={nuevoProducto.stock}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
                    placeholder="Stock inicial"
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={agregarProducto}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-150 hover:scale-105 active:scale-95"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <PlusIcon className="h-5 w-5" />
                      <span>CREAR</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ticket de Compra */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Cabecera del ticket */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="text-center">
                <h2 className="text-xl font-bold">🧾 TICKET DE COMPRA</h2>
                <p className="text-blue-100 text-sm mt-1">TPV Sistema - Punto de Venta</p>
                <p className="text-blue-100 text-xs">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Contenido del ticket */}
            <div className="p-6">
              {carrito.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">Carrito vacío</p>
                  <p className="text-gray-400 text-sm mt-1">Escanea productos para comenzar</p>
                </div>
              ) : (
                <>
                  {/* Línea de separación */}
                  <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                  
                  {/* Lista de productos */}
                  <div className="space-y-2 mb-6">
                    {carrito.map((item, index) => (
                      <div key={item.codigoBarra} className="group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.nombre}</p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Cantidad: {item.cantidad}</span>
                                <span>×</span>
                                <span>€{item.precio.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  €{(item.cantidad * item.precio).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => eliminarDelCarrito(item.codigoBarra)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                  title="Eliminar producto"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < carrito.length - 1 && (
                          <div className="border-b border-gray-200 mt-2"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Línea de separación */}
                  <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                  
                  {/* Resumen */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Productos:</span>
                      <span>{carrito.reduce((sum, item) => sum + item.cantidad, 0)} unidades</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Artículos diferentes:</span>
                      <span>{carrito.length}</span>
                    </div>
                  </div>

                  {/* Total destacado */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-center">
                      <p className="text-green-800 text-sm font-medium mb-1">TOTAL A PAGAR</p>
                      <p className="text-4xl font-bold text-green-600">€{total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Botón de procesar venta mejorado */}
                  <button
                    onClick={procesarVenta}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition-all duration-150 hover:scale-105 active:scale-95"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircleIcon className="h-6 w-6" />
                      <span className="text-lg">PROCESAR VENTA</span>
                    </div>
                  </button>

                  {/* Pie del ticket */}
                  <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center">
                    <p className="text-xs text-gray-500">¡Gracias por su compra!</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Atendido por: {usuario?.email || 'Cajero'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
