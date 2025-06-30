import { useState, useEffect, useRef } from "react";
import { where } from 'firebase/firestore';
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  UserIcon,
  SparklesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  ClockIcon,
  CurrencyEuroIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from "../../../AuthContext";
import { useSecureData } from "../../../contexts/SecureDataContext";
import { useNavigate } from "react-router-dom";

export default function TPVPage() {
  const { usuario, logout } = useAuth();
  const { secureGetDocs, secureAddDoc, secureUpdateDoc } = useSecureData();
  const navigate = useNavigate();
  
  // Refs para manejo de foco
  const codigoBarraInputRef = useRef(null);
  const cantidadInputRef = useRef(null);
  
  // Estados
  const [codigoBarra, setCodigoBarra] = useState("");
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [mostrarDropdownUsuario, setMostrarDropdownUsuario] = useState(false);
  const [configuracionTPV, setConfiguracionTPV] = useState({
    nombreCajero: '',
    nombreTienda: 'TPV Sistema'
  });
  const [userProfile, setUserProfile] = useState(null);
  const [userConfig, setUserConfig] = useState(null);
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

  // Cargar configuración de la aplicación
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        // Cargar perfil del usuario
        if (usuario?.email) {
          try {
            const perfiles = await secureGetDocs('perfiles', []);
            if (perfiles.length > 0) {
              setUserProfile(perfiles[0]);
            }
          } catch (error) {
            console.log('Error cargando perfil:', error);
          }

          try {
            const config = await secureGetDocs('configuraciones', []);
            if (config.length > 0) {
              setUserConfig(config[0]);
              setConfiguracionTPV({
                nombreCajero: config[0].nombreCajero || '',
                nombreTienda: config[0].nombreTienda || 'TPV Sistema'
              });
            }
          } catch (error) {
            console.log('Error cargando configuración desde Firebase:', error);
          }
        }

        // Primero intentar cargar desde localStorage (como fallback)
        const configLocal = localStorage.getItem('configImpresion');
        if (configLocal && !userConfig) {
          const config = JSON.parse(configLocal);
          setConfiguracionTPV({
            nombreCajero: config.nombreCajero || '',
            nombreTienda: config.nombreTienda || 'TPV Sistema'
          });
        }
      } catch (error) {
        console.log('Error cargando configuración:', error);
      }
    };

    cargarConfiguracion();
  }, [usuario, secureGetDocs]);

  // Función para obtener el nombre del cajero con prioridad unificada
  // Para cambiar el nombre del cajero, ve a: Perfil > Información Personal o Configuración > Información de la Tienda > Nombre del Cajero
  const obtenerNombreCajero = () => {
    // 1. Prioridad: nombre del perfil
    if (userProfile?.nombre && userProfile.nombre.trim()) {
      return userProfile.nombre.trim();
    }
    
    // 2. Prioridad: nombre del cajero en configuración
    if (userConfig?.nombreCajero && userConfig.nombreCajero.trim() && userConfig.nombreCajero !== 'Cajero') {
      return userConfig.nombreCajero.trim();
    }
    
    // 3. Prioridad: displayName de Firebase Auth
    if (usuario?.displayName && usuario.displayName.trim()) {
      return usuario.displayName.trim();
    }
    
    // 4. Prioridad: email formateado (sin dominio y con primera letra mayúscula)
    if (usuario?.email) {
      const nombreEmail = usuario.email.split('@')[0];
      const nombreFormateado = nombreEmail.charAt(0).toUpperCase() + nombreEmail.slice(1);
      return nombreFormateado;
    }
    
    // 5. Fallback por defecto
    return 'Cajero Principal';
  };

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

  // Función para procesar venta (declarada antes del useEffect)
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

      // Agregar la venta usando el contexto seguro
      const docRef = await secureAddDoc('ventas', ventaData);
      console.log("Venta registrada con ID:", docRef.id);

      // Actualizar el stock de cada producto
      let stockUpdatesSuccessful = 0;
      for (const item of carrito) {
        try {
          // Buscar el producto por codigoBarra
          const productos = await secureGetDocs('productos', []);
          const producto = productos.find(p => p.codigoBarra === item.codigoBarra);
          
          if (producto) {
            const newStock = producto.stock - item.cantidad;
            
            // Actualizar stock usando el contexto seguro
            await secureUpdateDoc('productos', producto.id, {
              stock: newStock
            });
            
            console.log(`✅ Stock actualizado para ${item.nombre}: ${producto.stock} -> ${newStock}`);
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
      
      // Enfocar automáticamente el input de código de barras para la siguiente venta
      setTimeout(() => {
        if (codigoBarraInputRef.current) {
          codigoBarraInputRef.current.focus();
        }
      }, 500); // Pequeño delay para que el usuario vea el resultado
      
    } catch (error) {
      console.error("❌ Error al procesar venta:", error);
      alert("❌ Error al procesar la venta: " + error.message);
    }
  };

  // Manejar atajos de teclado globales
  useEffect(() => {
    const handleGlobalKeydown = (e) => {
      // Ctrl + Z para eliminar último producto del carrito
      if (e.ctrlKey && e.key === 'z' && carrito.length > 0) {
        e.preventDefault();
        const ultimoProducto = carrito[carrito.length - 1];
        const confirmar = confirm(
          `¿Eliminar "${ultimoProducto.nombre}" del carrito?\n\n` +
          `Cantidad: ${ultimoProducto.cantidad}\n` +
          `Subtotal: €${(ultimoProducto.precio * ultimoProducto.cantidad).toFixed(2)}`
        );
        
        if (confirmar) {
          setCarrito(prev => prev.slice(0, -1));
          // Enfocar código de barras después de eliminar
          setTimeout(() => {
            if (codigoBarraInputRef.current) {
              codigoBarraInputRef.current.focus();
            }
          }, 100);
        }
      }
      
      // F2 para procesar venta rápida
      if (e.key === 'F2' && carrito.length > 0) {
        e.preventDefault();
        procesarVenta();
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [carrito, procesarVenta]);

  const buscarProducto = async () => {
    if (!codigoBarra.trim()) return;

    try {
      // Buscar producto usando el contexto seguro
      const productos = await secureGetDocs('productos', []);
      const productoEncontrado = productos.find(p => p.codigoBarra === codigoBarra);
      
      if (productoEncontrado) {
        // Verificar si el producto ya está en el carrito
        const itemExistente = carrito.find(item => item.codigoBarra === codigoBarra);
        
        if (itemExistente && itemExistente.cantidad < productoEncontrado.stock) {
          // Producto ya está en carrito y hay stock, preguntar si agregar una unidad más
          const agregarOtra = confirm(
            `"${productoEncontrado.nombre}" ya está en el carrito (${itemExistente.cantidad} unidades).\n\n` +
            `¿Desea agregar 1 unidad más?\n\n` +
            `Presione "Aceptar" para agregar otra unidad\n` +
            `o "Cancelar" para modificar la cantidad manualmente.`
          );
          
          if (agregarOtra) {
            // Agregar una unidad directamente
            setCarrito(carrito.map(item =>
              item.codigoBarra === codigoBarra
                ? { ...item, cantidad: item.cantidad + 1 }
                : item
            ));
            
            // Limpiar y volver al código de barras
            setCodigoBarra("");
            setTimeout(() => {
              if (codigoBarraInputRef.current) {
                codigoBarraInputRef.current.focus();
              }
            }, 100);
            return;
          }
        }
        
        // Producto encontrado - flujo normal
        setProducto(productoEncontrado);
        setNoEncontrado(false);
        setCantidad(1); // Reset cantidad a 1
        console.log("Producto encontrado:", productoEncontrado);
        
        // Enfocar el input de cantidad después de un pequeño delay
        setTimeout(() => {
          if (cantidadInputRef.current) {
            cantidadInputRef.current.focus();
            cantidadInputRef.current.select();
          }
        }, 100);
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

      // Agregar producto usando el contexto seguro
      const docRef = await secureAddDoc('productos', nuevoProductoData);
      
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
      // Mantener foco en cantidad para corrección
      setTimeout(() => {
        if (cantidadInputRef.current) {
          cantidadInputRef.current.focus();
          cantidadInputRef.current.select();
        }
      }, 100);
      return;
    }

    // Verificar si ya existe en el carrito para validar stock total
    const itemExistente = carrito.find(item => item.codigoBarra === producto.codigoBarra);
    const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + cantidadNumerica;

    if (cantidadTotal > producto.stock) {
      alert(`Stock insuficiente. Ya tienes ${cantidadEnCarrito} en el carrito. Máximo disponible: ${producto.stock - cantidadEnCarrito}`);
      // Mantener foco en cantidad para corrección
      setTimeout(() => {
        if (cantidadInputRef.current) {
          cantidadInputRef.current.focus();
          cantidadInputRef.current.select();
        }
      }, 100);
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

    // Limpiar y volver al input de código de barras
    setProducto(null);
    setCodigoBarra("");
    setCantidad(1);
    setNoEncontrado(false);
    
    // Enfocar de nuevo el input de código de barras para continuar escaneando
    setTimeout(() => {
      if (codigoBarraInputRef.current) {
        codigoBarraInputRef.current.focus();
      }
    }, 100);
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
          <div>Cajero: ${obtenerNombreCajero()}</div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Premium */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <ShoppingCartIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  TPV Sistema
                </h1>
                <p className="text-sm text-gray-500">Punto de Venta Profesional</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Indicadores de atajos de teclado */}
              <div className="hidden lg:flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                  <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-700">ENTER</span>
                  <span className="text-blue-600">Buscar/Agregar</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                  <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-purple-700">ESC</span>
                  <span className="text-purple-600">Volver</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
                  <span className="font-mono bg-orange-100 px-2 py-0.5 rounded text-orange-700">Ctrl+Z</span>
                  <span className="text-orange-600">Eliminar último</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                  <span className="font-mono bg-green-100 px-2 py-0.5 rounded text-green-700">F2</span>
                  <span className="text-green-600">Procesar venta</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <p className="text-sm text-gray-500">Cajero</p>
                  {configuracionTPV.nombreCajero && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Nombre personalizado configurado"></div>
                  )}
                </div>
                <p className="font-semibold text-gray-900">
                  {obtenerNombreCajero()}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {obtenerNombreCajero().charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Section - Scanning & Product Info */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Scanner Section */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Escanear Producto</h2>
                        <p className="text-sm text-gray-500">Código de barras o búsqueda manual</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700">Sistema Activo</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur"></div>
                    <div className="relative flex space-x-4">
                      <div className="flex-1 relative group">
                        <input
                          ref={codigoBarraInputRef}
                          type="text"
                          value={codigoBarra}
                          onChange={(e) => setCodigoBarra(e.target.value)}
                          placeholder="Escanea o escribe el código de barras..."
                          className="w-full px-6 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-inner placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 group-hover:shadow-lg"
                          onKeyPress={(e) => e.key === "Enter" && buscarProducto()}
                          autoFocus
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                            <SparklesIcon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={buscarProducto}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                        <div className="relative flex items-center space-x-2">
                          <MagnifyingGlassIcon className="h-5 w-5" />
                          <span>Buscar</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Producto encontrado */}
            {producto && (
              <div className="group relative animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-green-200/50 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-800">Producto Encontrado</h3>
                          <p className="text-sm text-green-600">Listo para agregar al carrito</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Disponible</span>
                      </div>
                    </div>
                    
                    {/* Product Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl blur group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 group-hover:shadow-lg transition-all duration-300">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <SparklesIcon className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-1">PRODUCTO</p>
                            <p className="text-lg font-bold text-gray-900 leading-tight">{producto.nombre}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl blur group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 group-hover:shadow-lg transition-all duration-300">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CurrencyEuroIcon className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-1">PRECIO</p>
                            <p className="text-2xl font-bold text-emerald-600">€{producto.precio.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl blur group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 group-hover:shadow-lg transition-all duration-300">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <ReceiptPercentIcon className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-1">STOCK</p>
                            <p className={`text-xl font-bold ${
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

                    {/* Quantity and Add to Cart */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                      <div className="flex items-center space-x-6">
                        <label className="text-sm font-semibold text-gray-700">Cantidad:</label>
                        <div className="relative">
                          <input
                            ref={cantidadInputRef}
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
                              // Permitir teclas de navegación
                              if (['Delete', 'Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                return;
                              }
                              
                              // Enter para agregar al carrito
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const cantidadActual = parseInt(cantidad) || 1;
                                if (cantidadActual > 0 && cantidadActual <= producto.stock) {
                                  agregarAlCarrito();
                                }
                                return;
                              }
                              
                              // Escape para volver al código de barras
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                if (codigoBarraInputRef.current) {
                                  codigoBarraInputRef.current.focus();
                                }
                                return;
                              }
                              
                              // Solo permitir números
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="1"
                            className="w-24 px-4 py-3 text-center text-lg font-bold bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-inner"
                          />
                          <div className="absolute -bottom-8 left-0 right-0 text-center space-y-1">
                            <div className="text-xs text-blue-600 font-medium">
                              ENTER: Agregar • ESC: Volver a código
                            </div>
                          </div>
                        </div>
                        {cantidad > producto.stock && (
                          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 rounded-full">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-red-600">
                              Stock insuficiente (máx: {producto.stock})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={agregarAlCarrito}
                        disabled={(parseInt(cantidad) || 1) > producto.stock || producto.stock === 0}
                        className={`group relative px-8 py-4 font-bold text-lg rounded-xl shadow-lg transform transition-all duration-200 overflow-hidden ${
                          (parseInt(cantidad) || 1) > producto.stock || producto.stock === 0
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105 active:scale-95'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                        <div className="relative flex items-center space-x-3">
                          <PlusIcon className="h-6 w-6" />
                          <span>{producto.stock === 0 ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}</span>
                          <div className="text-xs opacity-70">
                            (ENTER)
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Producto no encontrado */}
            {noEncontrado && (
              <div className="group relative animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-amber-200/50 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <SparklesIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-amber-800">Producto No Encontrado</h3>
                          <p className="text-sm text-amber-600">Crear nuevo producto en el sistema</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-1 bg-amber-100 rounded-full">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-amber-700">Nuevo</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6">
                      <p className="text-amber-800 font-medium mb-2">
                        El código <span className="font-bold bg-amber-200 px-3 py-1 rounded-lg">{codigoBarra}</span> no existe en el sistema.
                      </p>
                      <p className="text-amber-700">
                        Complete los datos para crear este producto nuevo:
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative group">
                        <input
                          type="text"
                          value={nuevoProducto.nombre}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                          placeholder="Nombre del producto"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-inner placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 group-hover:shadow-lg"
                        />
                      </div>
                      <div className="relative group">
                        <input
                          type="number"
                          value={nuevoProducto.precio}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                          placeholder="Precio (€)"
                          step="0.01"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-inner placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 group-hover:shadow-lg"
                        />
                      </div>
                      <div className="relative group">
                        <input
                          type="number"
                          value={nuevoProducto.stock}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
                          placeholder="Stock inicial"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-inner placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 group-hover:shadow-lg"
                        />
                      </div>
                      <button
                        onClick={agregarProducto}
                        className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                        <div className="relative flex items-center justify-center space-x-2">
                          <PlusIcon className="h-5 w-5" />
                          <span>CREAR</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Premium Cart */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                  
                  {/* Cart Header */}
                  <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-600/90 backdrop-blur-sm"></div>
                    <div className="relative text-center text-white">
                      <div className="flex items-center justify-center space-x-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <ShoppingCartIcon className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Ticket de Compra</h2>
                          <p className="text-indigo-100 text-sm">TPV Sistema Professional</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-xs text-indigo-100">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Content */}
                  <div className="p-6">
                    {carrito.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full blur opacity-50"></div>
                          <div className="relative w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Carrito Vacío</h3>
                        <p className="text-gray-500 mb-4">Escanea productos para comenzar</p>
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-700">Esperando productos...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Divider */}
                        <div className="border-b-2 border-dashed border-gray-200 mb-6 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"></div>
                        </div>
                        
                        {/* Products List */}
                        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {carrito.map((item, index) => (
                            <div key={item.codigoBarra} className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative p-4 rounded-xl border border-gray-100 group-hover:border-gray-200 group-hover:shadow-md transition-all duration-300">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate mb-1">{item.nombre}</p>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                      <div className="flex items-center space-x-3">
                                        <span className="bg-blue-100 px-2 py-1 rounded-full text-blue-700 font-medium">
                                          {item.cantidad} ud.
                                        </span>
                                        <span>×</span>
                                        <span className="font-medium">€{item.precio.toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="text-lg font-bold text-gray-900">
                                          €{(item.cantidad * item.precio).toFixed(2)}
                                        </span>
                                        <button
                                          onClick={() => eliminarDelCarrito(item.codigoBarra)}
                                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                          title="Eliminar producto"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {index < carrito.length - 1 && (
                                  <div className="border-b border-gray-100 mt-3"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Divider */}
                        <div className="border-b-2 border-dashed border-gray-200 mb-6"></div>
                        
                        {/* Summary */}
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Total productos:</span>
                            <span className="font-bold text-blue-600">{carrito.reduce((sum, item) => sum + item.cantidad, 0)} unidades</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Artículos diferentes:</span>
                            <span className="font-bold text-purple-600">{carrito.length}</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur"></div>
                          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                            <div className="text-center">
                              <p className="text-green-800 text-sm font-bold mb-2 uppercase tracking-wide">Total a Pagar</p>
                              <div className="flex items-center justify-center space-x-2">
                                <CurrencyEuroIcon className="h-8 w-8 text-green-600" />
                                <p className="text-4xl font-bold text-green-600">{total.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Process Sale Button */}
                        <button
                          onClick={procesarVenta}
                          className="group relative w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-5 px-6 rounded-2xl shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                          <div className="relative flex items-center justify-center space-x-3">
                            <div className="p-1 bg-white/20 rounded-lg">
                              <CheckCircleIcon className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xl">PROCESAR VENTA</span>
                              <span className="text-sm opacity-70">(F2)</span>
                            </div>
                          </div>
                        </button>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 text-center">
                          <p className="text-xs text-gray-500 mb-1">¡Gracias por su compra!</p>
                          <p className="text-xs text-gray-400">
                            Atendido por: <span className="font-medium">
                              {obtenerNombreCajero()}
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
