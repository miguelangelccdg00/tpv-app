import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  PhotoIcon,
  TagIcon,
  ChartBarIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSecureData } from '../../../contexts/SecureDataContext';

const ProductosPage = () => {
  const { secureOnSnapshot, secureAddDoc, secureUpdateDoc, secureDeleteDoc, diagnosticarSistema } = useSecureData();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [ordenPor, setOrdenPor] = useState('nombre'); // nombre, precio, stock, popularidad
  const [vistaActual, setVistaActual] = useState('catalogo'); // catalogo, lista, estadisticas
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState('agregar');
  const [productoEditando, setProductoEditando] = useState(null);
  const [formData, setFormData] = useState({
    codigoBarra: '',
    nombre: '',
    descripcion: '',
    precioCosto: '',
    precio: '',
    precioOriginal: '',
    iva: '21',
    stock: '',
    categoria: '',
    proveedor: '',
    imagen: '',
    etiquetas: '',
    activo: true
  });
  const [errors, setErrors] = useState({});
  const [estadisticas, setEstadisticas] = useState({});

  // Cargar productos con el contexto seguro
  useEffect(() => {
    setLoading(true);
    
    // Crear listener seguro SIN ordenamiento (para evitar problemas de índices)
    // El ordenamiento se hará en el cliente
    const unsubscribe = secureOnSnapshot('productos', [], (productosData) => {
      // Ordenar en el cliente según la preferencia
      let productosOrdenados = [...productosData];
      
      if (ordenPor === 'precio') {
        productosOrdenados.sort((a, b) => (a.precio || 0) - (b.precio || 0));
      } else if (ordenPor === 'stock') {
        productosOrdenados.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      } else {
        productosOrdenados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      }
      
      setProductos(productosOrdenados);
      setLoading(false);
      setError(null);
      
      // Extraer categorías únicas
      const categoriasUnicas = [...new Set(productosOrdenados.map(p => p.categoria).filter(Boolean))];
      setCategorias(categoriasUnicas);
      
      // Calcular estadísticas
      calcularEstadisticas(productosOrdenados);
    });

    return unsubscribe;
  }, [ordenPor, secureOnSnapshot]);

  // Calcular beneficio y margen
  const calcularBeneficio = (precioCosto, precioVenta, iva) => {
    const costo = parseFloat(precioCosto) || 0;
    const venta = parseFloat(precioVenta) || 0;
    const ivaValue = parseFloat(iva) || 0;
    const ivaDecimal = ivaValue / 100;
    
    const impuestoIva = venta * ivaDecimal;
    const precioSinIva = venta - impuestoIva;
    const beneficio = precioSinIva - costo;
    const margenPorcentaje = costo > 0 ? (beneficio / costo) * 100 : 0;
    
    return {
      beneficio,
      margenPorcentaje,
      impuestoIva,
      precioSinIva
    };
  };

  // Helper para calcular beneficio con IVA por defecto
  const calcularBeneficioProducto = (producto) => {
    return calcularBeneficio(producto.precioCosto, producto.precio, producto.iva ?? 21);
  };

  // Calcular estadísticas de productos
  const calcularEstadisticas = (productosData) => {
    const beneficioTotal = productosData.reduce((sum, p) => {
      const calculo = calcularBeneficioProducto(p);
      return sum + (calculo.beneficio * (p.stock || 0));
    }, 0);

    const valorCostoTotal = productosData.reduce((sum, p) => sum + ((p.precioCosto || 0) * (p.stock || 0)), 0);
    const valorVentaTotal = productosData.reduce((sum, p) => sum + ((p.precio || 0) * (p.stock || 0)), 0);

    const stats = {
      totalProductos: productosData.length,
      categorias: [...new Set(productosData.map(p => p.categoria).filter(Boolean))].length,
      valorPromedio: productosData.reduce((sum, p) => sum + (p.precio || 0), 0) / productosData.length || 0,
      valorCostoTotal,
      valorVentaTotal,
      beneficioTotal,
      margenPromedio: valorCostoTotal > 0 ? ((valorVentaTotal - valorCostoTotal) / valorCostoTotal) * 100 : 0,
      conDescuento: productosData.filter(p => p.precioOriginal && p.precioOriginal > p.precio).length,
      sinImagen: productosData.filter(p => !p.imagen).length,
      activos: productosData.filter(p => p.activo !== false).length
    };
    setEstadisticas(stats);
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const matchBusqueda = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.codigoBarra.includes(searchTerm) ||
                         (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (producto.etiquetas && producto.etiquetas.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCategoria = filtroCategoria === 'todas' || producto.categoria === filtroCategoria;

    return matchBusqueda && matchCategoria;
  });

  // Generar código de barras automático
  const generarCodigoBarra = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp.slice(-8)}${random}`;
  };

  // Manejar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.codigoBarra.trim()) newErrors.codigoBarra = 'Código de barras requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre requerido';
    if (!formData.precioCosto || formData.precioCosto <= 0) newErrors.precioCosto = 'Precio de costo válido requerido';
    if (!formData.precio || formData.precio <= 0) newErrors.precio = 'Precio de venta válido requerido';
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = 'Stock válido requerido';
    if (!formData.iva || formData.iva < 0 || formData.iva > 100) newErrors.iva = 'IVA válido requerido (0-100%)';

    // Validar que el precio de venta sea mayor al costo
    if (formData.precioCosto && formData.precio && parseFloat(formData.precio) <= parseFloat(formData.precioCosto)) {
      newErrors.precio = 'El precio de venta debe ser mayor al precio de costo';
    }

    // Verificar código único
    if (modalTipo === 'agregar' || (modalTipo === 'editar' && formData.codigoBarra !== productoEditando.codigoBarra)) {
      const codigoExiste = productos.some(p => p.codigoBarra === formData.codigoBarra);
      if (codigoExiste) {
        newErrors.codigoBarra = 'Este código de barras ya existe';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const productData = {
        codigoBarra: formData.codigoBarra.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precioCosto: parseFloat(formData.precioCosto),
        precio: parseFloat(formData.precio),
        precioOriginal: formData.precioOriginal ? parseFloat(formData.precioOriginal) : null,
        iva: parseFloat(formData.iva),
        stock: parseInt(formData.stock),
        categoria: formData.categoria.trim() || 'Sin categoría',
        proveedor: formData.proveedor.trim() || 'Sin proveedor',
        imagen: formData.imagen.trim(),
        etiquetas: formData.etiquetas.trim(),
        activo: formData.activo,
        fechaActualizacion: new Date().toISOString()
      };

      if (modalTipo === 'agregar') {
        await secureAddDoc('productos', productData);
      } else {
        await secureUpdateDoc('productos', productoEditando.id, productData);
      }

      cerrarModal();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar el producto: ' + error.message);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (producto) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) return;

    try {
      await secureDeleteDoc('productos', producto.id);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto: ' + error.message);
    }
  };

  // Duplicar producto
  const duplicarProducto = (producto) => {
    setModalTipo('agregar');
    setFormData({
      codigoBarra: generarCodigoBarra(),
      nombre: `${producto.nombre} (Copia)`,
      descripcion: producto.descripcion || '',
      precioCosto: producto.precioCosto?.toString() || '',
      precio: producto.precio.toString(),
      precioOriginal: producto.precioOriginal?.toString() || '',
      iva: producto.iva?.toString() || '21',
      stock: '0',
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || '',
      imagen: producto.imagen || '',
      etiquetas: producto.etiquetas || '',
      activo: true
    });
    setErrors({});
    setModalAbierto(true);
  };

  // Abrir modal para agregar
  const abrirModalAgregar = () => {
    setModalTipo('agregar');
    setFormData({
      codigoBarra: generarCodigoBarra(),
      nombre: '',
      descripcion: '',
      precioCosto: '',
      precio: '',
      precioOriginal: '',
      iva: '21',
      stock: '',
      categoria: '',
      proveedor: '',
      imagen: '',
      etiquetas: '',
      activo: true
    });
    setErrors({});
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (producto) => {
    setModalTipo('editar');
    setProductoEditando(producto);
    setFormData({
      codigoBarra: producto.codigoBarra,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precioCosto: producto.precioCosto?.toString() || '',
      precio: producto.precio.toString(),
      precioOriginal: producto.precioOriginal?.toString() || '',
      iva: (producto.iva ?? 21).toString(),
      stock: producto.stock.toString(),
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || '',
      imagen: producto.imagen || '',
      etiquetas: producto.etiquetas || '',
      activo: producto.activo !== false
    });
    setErrors({});
    setModalAbierto(true);
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditando(null);
    setFormData({
      codigoBarra: '',
      nombre: '',
      descripcion: '',
      precioCosto: '',
      precio: '',
      precioOriginal: '',
      iva: '21',
      stock: '',
      categoria: '',
      proveedor: '',
      imagen: '',
      etiquetas: '',
      activo: true
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Error al cargar productos</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header con estadísticas y controles */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Catálogo de Productos
              </h2>
              <p className="text-slate-600 text-lg">Gestiona tu inventario de forma inteligente</p>
            </div>
            
            {/* Controles de vista modernos */}
            <div className="flex items-center space-x-4">
              <div className="flex backdrop-blur-sm bg-white/60 rounded-2xl p-1.5 shadow-lg border border-white/30">
                <button
                  onClick={() => setVistaActual('catalogo')}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${vistaActual === 'catalogo' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>Catálogo</span>
                  </div>
                </button>
                <button
                  onClick={() => setVistaActual('lista')}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${vistaActual === 'lista' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}`}
                >
                  <div className="flex items-center space-x-2">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    <span>Lista</span>
                  </div>
                </button>
                <button
                  onClick={() => setVistaActual('estadisticas')}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${vistaActual === 'estadisticas' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}`}
                >
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>Stats</span>
                  </div>
                </button>
              </div>
              
              <button
                onClick={abrirModalAgregar}
                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <PlusIcon className="h-5 w-5 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                <span className="relative z-10">Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Estadísticas rápidas con diseño moderno */}
          {vistaActual === 'estadisticas' ? (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="group relative backdrop-blur-sm bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-200/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{estadisticas.totalProductos}</div>
                  <div className="text-sm font-medium text-blue-700 mt-1">Total Productos</div>
                </div>
              </div>
              
              <div className="group relative backdrop-blur-sm bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-200/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-emerald-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">{estadisticas.categorias}</div>
                  <div className="text-sm font-medium text-emerald-700 mt-1">Categorías</div>
                </div>
              </div>
              
              <div className="group relative backdrop-blur-sm bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-200/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-amber-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">€{estadisticas.valorCostoTotal?.toFixed(2)}</div>
                  <div className="text-sm font-medium text-amber-700 mt-1">Valor Costo</div>
                </div>
              </div>
              
              <div className="group relative backdrop-blur-sm bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-200/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">€{estadisticas.valorVentaTotal?.toFixed(2)}</div>
                  <div className="text-sm font-medium text-purple-700 mt-1">Valor Venta</div>
                </div>
              </div>
              
              <div className="group relative backdrop-blur-sm bg-gradient-to-br from-teal-500/10 to-teal-600/20 border border-teal-200/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-teal-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">€{estadisticas.beneficioTotal?.toFixed(2)}</div>
                  <div className="text-sm font-medium text-teal-700 mt-1">Beneficio Total</div>
                </div>
              </div>
              
              <div className="group relative backdrop-blur-sm bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 border border-indigo-200/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">{estadisticas.margenPromedio?.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-indigo-700 mt-1">Margen Promedio</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="relative group">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-full px-4 py-3 backdrop-blur-sm bg-white/70 border border-white/30 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300"
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-4 py-3 backdrop-blur-sm bg-white/70 border border-white/30 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 text-slate-700"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>

              <select
                value={ordenPor}
                onChange={(e) => setOrdenPor(e.target.value)}
                className="w-full px-4 py-3 backdrop-blur-sm bg-white/70 border border-white/30 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 text-slate-700"
              >
                <option value="nombre">Ordenar por nombre</option>
                <option value="precio">Ordenar por precio</option>
                <option value="stock">Ordenar por stock</option>
              </select>

              <div className="flex items-center justify-center backdrop-blur-sm bg-white/60 border border-white/30 rounded-2xl shadow-lg px-4 py-3">
                <span className="text-sm font-medium text-slate-600">
                  <span className="text-blue-600 font-bold">{productosFiltrados.length}</span> de {productos.length} productos
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Vista de catálogo moderna */}
        {vistaActual === 'catalogo' && (
          <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {productosFiltrados.map((producto) => (
                <div key={producto.id} className="group relative backdrop-blur-sm bg-white/80 border border-white/30 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden transform hover:scale-105">
                  {/* Imagen del producto con overlay */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-slate-100 to-slate-200">
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center" style={{display: producto.imagen ? 'none' : 'flex'}}>
                      <PhotoIcon className="h-16 w-16 text-slate-400" />
                    </div>
                    
                    {/* Overlay con acciones rápidas */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="text-white">
                          <div className="text-xs font-medium opacity-90">Código</div>
                          <div className="text-sm font-bold">{producto.codigoBarra}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => abrirModalEditar(producto)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={() => duplicarProducto(producto)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200"
                            title="Duplicar"
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={() => eliminarProducto(producto)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-red-500/70 transition-all duration-200"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge de estado */}
                    {producto.activo === false && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/90 text-white backdrop-blur-sm border border-red-400/30">
                          Inactivo
                        </span>
                      </div>
                    )}
                    
                    {/* Badge de oferta */}
                    {producto.precioOriginal && producto.precioOriginal > producto.precio && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/90 text-white backdrop-blur-sm border border-emerald-400/30">
                          Oferta
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Nombre y descripción */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">{producto.nombre}</h3>
                      {producto.descripcion && (
                        <p className="text-sm text-slate-600 line-clamp-2">{producto.descripcion}</p>
                      )}
                    </div>

                    {/* Precios con diseño moderno */}
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-3">
                        {producto.precioOriginal && producto.precioOriginal > producto.precio ? (
                          <>
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">€{producto.precio.toFixed(2)}</span>
                            <span className="text-lg text-slate-400 line-through font-medium">€{producto.precioOriginal.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">€{producto.precio.toFixed(2)}</span>
                        )}
                      </div>
                      
                      {/* Información adicional */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${producto.stock <= 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          <span className={`font-medium ${producto.stock <= 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                            Stock: {producto.stock}
                          </span>
                        </div>
                        {producto.precioCosto && (
                          <span className="text-slate-500 font-medium">
                            Costo: €{producto.precioCosto.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Beneficio y margen */}
                    {producto.precioCosto && (
                      <div className="backdrop-blur-sm bg-slate-50/80 border border-slate-200/50 rounded-2xl p-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 font-medium">Beneficio:</span>
                          <span className={`font-bold ${
                            calcularBeneficioProducto(producto).beneficio >= 0 
                              ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            €{calcularBeneficioProducto(producto).beneficio.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-slate-600 font-medium">Margen:</span>
                          <span className={`font-bold ${
                            calcularBeneficioProducto(producto).margenPorcentaje >= 0 
                              ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {calcularBeneficioProducto(producto).margenPorcentaje.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Categoría */}
                    {producto.categoria && (
                      <div className="pt-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50">
                          <TagIcon className="h-3 w-3 mr-1.5" />
                          {producto.categoria}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vista de lista moderna (tabla) */}
        {vistaActual === 'lista' && (
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/50">
                <thead className="backdrop-blur-sm bg-gradient-to-r from-slate-50/80 to-blue-50/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Costo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Beneficio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="backdrop-blur-sm bg-white/60 divide-y divide-slate-200/30">
                  {productosFiltrados.map((producto, index) => (
                    <tr key={producto.id} className={`hover:bg-white/70 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white/20' : 'bg-slate-50/20'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {producto.imagen ? (
                              <img src={producto.imagen} alt="" className="h-12 w-12 rounded-2xl object-cover shadow-md" />
                            ) : (
                              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-md">
                                <PhotoIcon className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-800">{producto.nombre}</div>
                            <div className="text-sm text-slate-500">{producto.proveedor}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-700 bg-slate-100/70 px-2 py-1 rounded-lg">
                          {producto.codigoBarra}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {producto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-800">
                          €{producto.precioCosto ? producto.precioCosto.toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs text-slate-500 bg-slate-100/50 px-2 py-0.5 rounded-md inline-block mt-1">
                          IVA: {producto.iva || 21}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {producto.precioOriginal && producto.precioOriginal > producto.precio ? (
                          <div>
                            <div className="text-sm font-bold text-emerald-600">€{producto.precio.toFixed(2)}</div>
                            <div className="text-xs text-slate-500 line-through">€{producto.precioOriginal.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-slate-800">€{producto.precio.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {producto.precioCosto ? (
                          <div>
                            <div className={`text-sm font-bold ${
                              calcularBeneficioProducto(producto).beneficio >= 0 
                                ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              €{calcularBeneficioProducto(producto).beneficio.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-100/50 px-2 py-0.5 rounded-md inline-block mt-1">
                              {calcularBeneficioProducto(producto).margenPorcentaje.toFixed(1)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Sin costo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          producto.stock === 0 ? 'bg-red-100 text-red-700 border border-red-200' :
                          producto.stock <= 10 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                          'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            producto.stock === 0 ? 'bg-red-500' :
                            producto.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></div>
                          {producto.stock} unidades
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          producto.activo !== false ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            producto.activo !== false ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></div>
                          {producto.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => abrirModalEditar(producto)} 
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => duplicarProducto(producto)} 
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                            title="Duplicar"
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => eliminarProducto(producto)} 
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal moderno para agregar/editar producto */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl backdrop-blur-xl bg-white/95 border border-white/30 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
              {/* Header del modal */}
              <div className="sticky top-0 backdrop-blur-xl bg-white/90 border-b border-white/30 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {modalTipo === 'agregar' ? 'Agregar Producto' : 'Editar Producto'}
                    </h3>
                    <p className="text-slate-600 mt-1">
                      {modalTipo === 'agregar' ? 'Completa la información del nuevo producto' : 'Modifica los datos del producto'}
                    </p>
                  </div>
                  <button 
                    onClick={cerrarModal} 
                    className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-2xl transition-all duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Información básica */}
                  <div className="backdrop-blur-sm bg-slate-50/80 border border-slate-200/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      Información Básica
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Código de Barras</label>
                        <input
                          type="text"
                          value={formData.codigoBarra}
                          onChange={(e) => setFormData({...formData, codigoBarra: e.target.value})}
                          className={`w-full px-4 py-3 backdrop-blur-sm bg-white/80 border rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 ${
                            errors.codigoBarra ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500/50' : 'border-slate-200/50'
                          }`}
                          placeholder="Escanea o introduce el código"
                        />
                        {errors.codigoBarra && <p className="mt-2 text-sm text-red-600 font-medium">{errors.codigoBarra}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Producto *</label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          className={`w-full px-4 py-3 backdrop-blur-sm bg-white/80 border rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 ${
                            errors.nombre ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500/50' : 'border-slate-200/50'
                          }`}
                          placeholder="Nombre descriptivo del producto"
                        />
                        {errors.nombre && <p className="mt-2 text-sm text-red-600 font-medium">{errors.nombre}</p>}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300"
                        placeholder="Descripción detallada del producto..."
                      />
                    </div>
                  </div>

                  {/* Precios y costos */}
                  <div className="backdrop-blur-sm bg-emerald-50/80 border border-emerald-200/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      Precios y Costos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Precio Costo *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precioCosto}
                          onChange={(e) => setFormData({...formData, precioCosto: e.target.value})}
                          className={`w-full px-4 py-3 backdrop-blur-sm bg-white/80 border rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-300 ${
                            errors.precioCosto ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500/50' : 'border-slate-200/50'
                          }`}
                          placeholder="0.00"
                        />
                        {errors.precioCosto && <p className="mt-2 text-sm text-red-600 font-medium">{errors.precioCosto}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Precio Venta *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precio}
                          onChange={(e) => setFormData({...formData, precio: e.target.value})}
                          className={`w-full px-4 py-3 backdrop-blur-sm bg-white/80 border rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-300 ${
                            errors.precio ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500/50' : 'border-slate-200/50'
                          }`}
                          placeholder="0.00"
                        />
                        {errors.precio && <p className="mt-2 text-sm text-red-600 font-medium">{errors.precio}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">IVA % *</label>
                        <select
                          value={formData.iva}
                          onChange={(e) => setFormData({...formData, iva: e.target.value})}
                          className={`w-full px-4 py-3 backdrop-blur-sm bg-white/80 border rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-300 ${
                            errors.iva ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500/50' : 'border-slate-200/50'
                          }`}
                        >
                          <option value="0">0% (Exento)</option>
                          <option value="4">4% (Reducido)</option>
                          <option value="10">10% (Reducido)</option>
                          <option value="21">21% (General)</option>
                        </select>
                        {errors.iva && <p className="mt-2 text-sm text-red-600 font-medium">{errors.iva}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Stock *</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => setFormData({...formData, stock: e.target.value})}
                          className={`w-full px-4 py-3 backdrop-blur-sm bg-white/80 border rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-300 ${
                            errors.stock ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500/50' : 'border-slate-200/50'
                          }`}
                          placeholder="0"
                        />
                        {errors.stock && <p className="mt-2 text-sm text-red-600 font-medium">{errors.stock}</p>}
                      </div>
                    </div>

                    {/* Cálculo automático del beneficio */}
                    {formData.precioCosto && formData.precio && (
                      <div className="mt-6 backdrop-blur-sm bg-white/70 border border-white/50 rounded-2xl p-6">
                        <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          Cálculo Automático de Beneficio
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-xs text-slate-500 font-medium">Precio sin IVA</div>
                            <div className="text-lg font-bold text-slate-800 mt-1">
                              €{calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).precioSinIva.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500 font-medium">IVA</div>
                            <div className="text-lg font-bold text-blue-600 mt-1">
                              €{calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).impuestoIva.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500 font-medium">Beneficio</div>
                            <div className={`text-lg font-bold mt-1 ${
                              calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).beneficio >= 0 
                                ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              €{calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).beneficio.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500 font-medium">Margen</div>
                            <div className={`text-lg font-bold mt-1 ${
                              calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).margenPorcentaje >= 0 
                                ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).margenPorcentaje.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Información adicional */}
                  <div className="backdrop-blur-sm bg-amber-50/80 border border-amber-200/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      Información Adicional
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Precio Original (Descuento)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precioOriginal}
                          onChange={(e) => setFormData({...formData, precioOriginal: e.target.value})}
                          className="w-full px-4 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                          placeholder="Para mostrar descuentos"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
                        <input
                          type="text"
                          value={formData.categoria}
                          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                          className="w-full px-4 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                          placeholder="Ej: Alimentación, Bebidas"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Proveedor</label>
                        <input
                          type="text"
                          value={formData.proveedor}
                          onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                          className="w-full px-4 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                          placeholder="Nombre del proveedor"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">URL de Imagen</label>
                        <input
                          type="url"
                          value={formData.imagen}
                          onChange={(e) => setFormData({...formData, imagen: e.target.value})}
                          className="w-full px-4 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Etiquetas</label>
                      <input
                        type="text"
                        value={formData.etiquetas}
                        onChange={(e) => setFormData({...formData, etiquetas: e.target.value})}
                        className="w-full px-4 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                        placeholder="oferta, nuevo, popular (separadas por comas)"
                      />
                    </div>

                    <div className="mt-6 flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                        className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded-lg"
                      />
                      <label className="ml-3 text-sm font-semibold text-slate-700">
                        Producto activo (visible en el catálogo)
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer del modal */}
              <div className="sticky bottom-0 backdrop-blur-xl bg-white/90 border-t border-white/30 px-8 py-6">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-6 py-3 backdrop-blur-sm bg-white/80 border border-slate-200/50 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50/80 shadow-lg transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    {modalTipo === 'agregar' ? '✨ Agregar Producto' : '🔄 Actualizar Producto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado vacío moderno */}
        {productosFiltrados.length === 0 && !loading && (
          <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center shadow-lg">
              <PhotoIcon className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No hay productos</h3>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              Comienza agregando tu primer producto al catálogo para gestionar tu inventario.
            </p>
            <button
              onClick={abrirModalAgregar}
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlusIcon className="h-6 w-6 mr-3 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10">Agregar Primer Producto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductosPage;
