import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  PhotoIcon,
  TagIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
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
    <div className="space-y-6">
      {/* Header con estadísticas y controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
          
          {/* Controles de vista */}
          <div className="flex items-center space-x-2">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setVistaActual('catalogo')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${vistaActual === 'catalogo' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Catálogo
              </button>
              <button
                onClick={() => setVistaActual('lista')}
                className={`px-3 py-2 text-sm font-medium border-t border-b ${vistaActual === 'lista' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Lista
              </button>
              <button
                onClick={() => setVistaActual('estadisticas')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border ${vistaActual === 'estadisticas' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Stats
              </button>
            </div>
            
            <button
              onClick={abrirModalAgregar}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {vistaActual === 'estadisticas' ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.totalProductos}</div>
                <div className="text-sm text-blue-900">Total Productos</div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{estadisticas.categorias}</div>
                <div className="text-sm text-green-900">Categorías</div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">€{estadisticas.valorCostoTotal?.toFixed(2)}</div>
                <div className="text-sm text-yellow-900">Valor Costo</div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">€{estadisticas.valorVentaTotal?.toFixed(2)}</div>
                <div className="text-sm text-purple-900">Valor Venta</div>
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">€{estadisticas.beneficioTotal?.toFixed(2)}</div>
                <div className="text-sm text-emerald-900">Beneficio Total</div>
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{estadisticas.margenPromedio?.toFixed(1)}%</div>
                <div className="text-sm text-indigo-900">Margen Promedio</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            <select
              value={ordenPor}
              onChange={(e) => setOrdenPor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="nombre">Ordenar por nombre</option>
              <option value="precio">Ordenar por precio</option>
              <option value="stock">Ordenar por stock</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              {productosFiltrados.length} de {productos.length} productos
            </div>
          </div>
        )}
      </div>

      {/* Vista de catálogo */}
      {vistaActual === 'catalogo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                {producto.imagen ? (
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="h-48 w-full object-cover object-center"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center" style={{display: producto.imagen ? 'none' : 'flex'}}>
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{producto.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1">{producto.codigoBarra}</p>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{producto.descripcion}</p>
                    )}
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {producto.activo === false && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {producto.precioOriginal && producto.precioOriginal > producto.precio ? (
                        <>
                          <span className="text-lg font-bold text-green-600">€{producto.precio.toFixed(2)}</span>
                          <span className="text-sm text-gray-500 line-through">€{producto.precioOriginal.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">€{producto.precio.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        Stock: <span className={`font-medium ${producto.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {producto.stock}
                        </span>
                      </div>
                      {producto.precioCosto && (
                        <div>
                          Costo: €{producto.precioCosto.toFixed(2)} | 
                          Beneficio: <span className={`font-medium ${
                            calcularBeneficioProducto(producto).beneficio >= 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            €{calcularBeneficioProducto(producto).beneficio.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => abrirModalEditar(producto)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => duplicarProducto(producto)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Duplicar"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {producto.categoria && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {producto.categoria}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista de lista (tabla) */}
      {vistaActual === 'lista' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {producto.imagen ? (
                            <img src={producto.imagen} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <PhotoIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-500">{producto.proveedor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.codigoBarra}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        €{producto.precioCosto ? producto.precioCosto.toFixed(2) : '0.00'}
                      </div>
                      <div className="text-xs text-gray-500">
                        IVA: {producto.iva || 21}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {producto.precioOriginal && producto.precioOriginal > producto.precio ? (
                        <div>
                          <div className="text-sm font-medium text-green-600">€{producto.precio.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 line-through">€{producto.precioOriginal.toFixed(2)}</div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">€{producto.precio.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {producto.precioCosto ? (
                        <div>
                          <div className={`text-sm font-medium ${
                            calcularBeneficioProducto(producto).beneficio >= 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            €{calcularBeneficioProducto(producto).beneficio.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {calcularBeneficioProducto(producto).margenPorcentaje.toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin costo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        producto.stock === 0 ? 'bg-red-100 text-red-800' :
                        producto.stock <= 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {producto.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        producto.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => abrirModalEditar(producto)} className="text-blue-600 hover:text-blue-900 mr-3">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => duplicarProducto(producto)} className="text-green-600 hover:text-green-900 mr-3">
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => eliminarProducto(producto)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalTipo === 'agregar' ? 'Agregar Producto' : 'Editar Producto'}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.codigoBarra}
                    onChange={(e) => setFormData({...formData, codigoBarra: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.codigoBarra ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.codigoBarra && <p className="mt-1 text-sm text-red-600">{errors.codigoBarra}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nombre ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Costo *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioCosto}
                    onChange={(e) => setFormData({...formData, precioCosto: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.precioCosto ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Lo que te cuesta"
                  />
                  {errors.precioCosto && <p className="mt-1 text-sm text-red-600">{errors.precioCosto}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.precio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Precio al cliente"
                  />
                  {errors.precio && <p className="mt-1 text-sm text-red-600">{errors.precio}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">IVA % *</label>
                  <select
                    value={formData.iva}
                    onChange={(e) => setFormData({...formData, iva: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.iva ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="0">0% (Exento)</option>
                    <option value="4">4% (Reducido)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="21">21% (General)</option>
                  </select>
                  {errors.iva && <p className="mt-1 text-sm text-red-600">{errors.iva}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.stock ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                </div>
              </div>

              {/* Cálculo automático del beneficio */}
              {formData.precioCosto && formData.precio && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Cálculo de Beneficio</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Precio sin IVA:</span>
                      <div className="font-medium">
                        €{calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).precioSinIva.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">IVA:</span>
                      <div className="font-medium">
                        €{calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).impuestoIva.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Beneficio:</span>
                      <div className={`font-medium ${
                        calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).beneficio >= 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        €{calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).beneficio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Margen:</span>
                      <div className={`font-medium ${
                        calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).margenPorcentaje >= 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {calcularBeneficio(formData.precioCosto, formData.precio, formData.iva).margenPorcentaje.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Original (Descuento)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioOriginal}
                    onChange={(e) => setFormData({...formData, precioOriginal: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Para mostrar descuentos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Alimentación, Bebidas, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL de Imagen</label>
                <input
                  type="url"
                  value={formData.imagen}
                  onChange={(e) => setFormData({...formData, imagen: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Etiquetas</label>
                <input
                  type="text"
                  value={formData.etiquetas}
                  onChange={(e) => setFormData({...formData, etiquetas: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="oferta, nuevo, popular (separadas por comas)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Producto activo (visible en el catálogo)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {modalTipo === 'agregar' ? 'Agregar Producto' : 'Actualizar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productosFiltrados.length === 0 && !loading && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza agregando un nuevo producto al catálogo.</p>
          <div className="mt-6">
            <button
              onClick={abrirModalAgregar}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Producto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosPage;
