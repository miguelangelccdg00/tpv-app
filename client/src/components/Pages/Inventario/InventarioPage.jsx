import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSecureData } from '../../../contexts/SecureDataContext';

const InventarioPage = () => {
  const { secureOnSnapshot, secureAddDoc, secureUpdateDoc, secureDeleteDoc, diagnosticarSistema } = useSecureData();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos'); // todos, bajo, sin-stock
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState('agregar'); // agregar, editar
  const [productoEditando, setProductoEditando] = useState(null);
  const [formData, setFormData] = useState({
    codigoBarra: '',
    nombre: '',
    precio: '',
    stock: '',
    categoria: '',
    proveedor: ''
  });
  const [errors, setErrors] = useState({});

  // Cargar productos en tiempo real con contexto seguro
  useEffect(() => {
    setLoading(true);
    
    // Crear listener seguro para productos
    const unsubscribe = secureOnSnapshot('productos', [], (productosData) => {
      // Ordenar por nombre en el cliente
      const productosOrdenados = productosData.sort((a, b) => 
        (a.nombre || '').localeCompare(b.nombre || '')
      );
      
      setProductos(productosOrdenados);
      setLoading(false);
    });

    return unsubscribe;
  }, [secureOnSnapshot]);

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const matchBusqueda = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.codigoBarra.includes(searchTerm) ||
                         (producto.categoria && producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchFiltro = true;
    if (filtroStock === 'bajo') {
      matchFiltro = producto.stock <= 10 && producto.stock > 0;
    } else if (filtroStock === 'sin-stock') {
      matchFiltro = producto.stock === 0;
    }

    return matchBusqueda && matchFiltro;
  });

  // Estadísticas
  const stats = {
    total: productos.length,
    sinStock: productos.filter(p => p.stock === 0).length,
    stockBajo: productos.filter(p => p.stock <= 10 && p.stock > 0).length,
    valorTotal: productos.reduce((sum, p) => sum + (p.precio * p.stock), 0)
  };

  // Manejar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const newErrors = {};
    if (!formData.codigoBarra.trim()) newErrors.codigoBarra = 'Código de barras requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre requerido';
    if (!formData.precio || formData.precio <= 0) newErrors.precio = 'Precio válido requerido';
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = 'Stock válido requerido';

    // Verificar código de barras único (solo en agregar o si cambió en editar)
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
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        categoria: formData.categoria.trim() || 'Sin categoría',
        proveedor: formData.proveedor.trim() || 'Sin proveedor',
        fechaActualizacion: new Date().toISOString()
      };

      if (modalTipo === 'agregar') {
        productData.fechaCreacion = new Date().toISOString();
        await addDoc(collection(db, 'productos'), productData);
      } else {
        const docRef = doc(db, 'productos', productoEditando.id);
        await updateDoc(docRef, productData);
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

  // Abrir modal para agregar
  const abrirModalAgregar = () => {
    setModalTipo('agregar');
    setFormData({
      codigoBarra: '',
      nombre: '',
      precio: '',
      stock: '',
      categoria: '',
      proveedor: ''
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
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || ''
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
      precio: '',
      stock: '',
      categoria: '',
      proveedor: ''
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h2>
          <button
            onClick={abrirModalAgregar}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Producto
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{stats.total}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Productos</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Sin Stock</p>
                <p className="text-lg font-bold text-red-900">{stats.sinStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Stock Bajo</p>
                <p className="text-lg font-bold text-yellow-900">{stats.stockBajo}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Valor Total</p>
                <p className="text-lg font-bold text-green-900">€{stats.valorTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos los productos</option>
            <option value="bajo">Stock bajo (≤10)</option>
            <option value="sin-stock">Sin stock</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productosFiltrados.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">{producto.proveedor || 'Sin proveedor'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {producto.codigoBarra}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {producto.categoria || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    €{producto.precio.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      producto.stock === 0 
                        ? 'bg-red-100 text-red-800'
                        : producto.stock <= 10 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {producto.stock} unidades
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{(producto.precio * producto.stock).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => abrirModalEditar(producto)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {productosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron productos que coincidan con los filtros.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalTipo === 'agregar' ? 'Agregar Producto' : 'Editar Producto'}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.precio ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.precio && <p className="mt-1 text-sm text-red-600">{errors.precio}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {modalTipo === 'agregar' ? 'Agregar' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;
