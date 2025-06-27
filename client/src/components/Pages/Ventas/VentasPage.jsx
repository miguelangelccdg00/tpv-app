import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  UserIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../../../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  limit,
  startAfter,
  endBefore,
  doc,
  getDoc
} from 'firebase/firestore';

const VentasPage = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todos'); // todos, hoy, semana, mes
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [estadisticas, setEstadisticas] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Cargar ventas en tiempo real
  useEffect(() => {
    const ventasRef = collection(db, 'ventas');
    const q = query(ventasRef, orderBy('fecha', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ventasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha ? new Date(doc.data().fecha) : new Date(),
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date()
      }));
      
      setVentas(ventasData);
      calcularEstadisticas(ventasData);
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar ventas:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calcular estadísticas
  const calcularEstadisticas = (ventasData) => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const ventasHoy = ventasData.filter(v => v.fecha >= inicioHoy);
    const ventasSemana = ventasData.filter(v => v.fecha >= inicioSemana);
    const ventasMes = ventasData.filter(v => v.fecha >= inicioMes);

    const stats = {
      totalVentas: ventasData.length,
      totalHoy: ventasHoy.length,
      totalSemana: ventasSemana.length,
      totalMes: ventasMes.length,
      
      ingresoTotal: ventasData.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoHoy: ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoSemana: ventasSemana.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoMes: ventasMes.reduce((sum, v) => sum + (v.total || 0), 0),
      
      promedioVenta: ventasData.length > 0 ? ventasData.reduce((sum, v) => sum + (v.total || 0), 0) / ventasData.length : 0,
      ventaMasAlta: Math.max(...ventasData.map(v => v.total || 0), 0),
      
      productosVendidos: ventasData.reduce((sum, v) => sum + (v.items?.reduce((itemSum, item) => itemSum + (item.cantidad || 0), 0) || 0), 0),
      
      clientesUnicos: [...new Set(ventasData.map(v => v.usuario).filter(Boolean))].length
    };

    setEstadisticas(stats);
  };

  // Filtrar ventas
  const ventasFiltradas = ventas.filter(venta => {
    // Filtro de búsqueda
    const matchBusqueda = searchTerm === '' || 
      venta.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.items?.some(item => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro de fecha
    let matchFecha = true;
    const ventaFecha = venta.fecha;
    const hoy = new Date();
    
    switch(filtroFecha) {
      case 'hoy':
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        matchFecha = ventaFecha >= inicioHoy;
        break;
      case 'semana':
        const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
        matchFecha = ventaFecha >= inicioSemana;
        break;
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        matchFecha = ventaFecha >= inicioMes;
        break;
      case 'personalizado':
        if (fechaInicio && fechaFin) {
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin + 'T23:59:59');
          matchFecha = ventaFecha >= inicio && ventaFecha <= fin;
        }
        break;
    }

    return matchBusqueda && matchFecha;
  });

  // Paginación
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const ventasPaginadas = ventasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Ver detalles de venta
  const verDetallesVenta = (venta) => {
    setVentaSeleccionada(venta);
    setModalDetalles(true);
  };

  // Exportar detalles de venta específica a PDF
  const exportarVentaPDF = (venta) => {
    try {
      console.log('Exportando venta individual a PDF:', venta.id);
      const doc = new jsPDF();
      
      // Configurar fuente
      doc.setFont('helvetica', 'normal');
      
      // Encabezado
      doc.setFontSize(20);
      doc.text('Detalle de Venta', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`ID: #${venta.id}`, 20, 35);
      doc.text(`Fecha: ${venta.fecha.toLocaleDateString()} ${venta.fecha.toLocaleTimeString()}`, 20, 45);
      doc.text(`Usuario: ${venta.usuario || 'Usuario anonimo'}`, 20, 55);
      
      // Línea separadora
      doc.line(20, 65, 190, 65);
      
      // Resumen de la venta
      doc.setFontSize(14);
      doc.text('Resumen de la Venta', 20, 80);
      
      doc.setFontSize(12);
      doc.text(`Productos diferentes: ${venta.items?.length || 0}`, 20, 95);
      doc.text(`Unidades totales: ${venta.items?.reduce((sum, item) => sum + (item.cantidad || 0), 0) || 0}`, 20, 105);
      doc.text(`Total: €${venta.total?.toFixed(2) || '0.00'}`, 20, 115);
      
      // Tabla de productos
      const productosData = venta.items?.map(item => [
        item.nombre || 'Sin nombre',
        item.codigoBarra || 'Sin codigo',
        (item.cantidad || 0).toString(),
        `€${item.precio?.toFixed(2) || '0.00'}`,
        `€${item.subtotal?.toFixed(2) || '0.00'}`
      ]) || [];
      
      autoTable(doc, {
        startY: 130,
        head: [['Producto', 'Codigo', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: productosData,
        foot: [['', '', '', 'TOTAL:', `€${venta.total?.toFixed(2) || '0.00'}`]],
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        footStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Producto
          1: { cellWidth: 40 }, // Código
          2: { cellWidth: 25, halign: 'center' }, // Cantidad
          3: { cellWidth: 30, halign: 'right' }, // Precio
          4: { cellWidth: 35, halign: 'right' } // Subtotal
        },
        margin: { left: 20, right: 20 }
      });
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('TPV Sistema - Detalle de Venta', 20, pageHeight - 10);
      doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.width - 80, pageHeight - 10);
      
      // Guardar
      const nombreArchivo = `venta-${venta.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Guardando PDF individual:', nombreArchivo);
      doc.save(nombreArchivo);
      
      console.log('PDF de venta individual exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF de venta:', error);
      alert(`Error al exportar PDF: ${error.message}`);
    }
  };

  // Cerrar modal de detalles
  const cerrarModalDetalles = () => {
    setModalDetalles(false);
    setVentaSeleccionada(null);
  };

  // Exportar datos a PDF
  const exportarDatos = () => {
    try {
      console.log('Iniciando exportación a PDF...');
      const doc = new jsPDF();
      
      // Configurar fuente para caracteres especiales
      doc.setFont('helvetica', 'normal');
      
      // Título del documento
      doc.setFontSize(20);
      doc.text('Historial de Ventas', 20, 20);
      
      // Fecha del reporte
      doc.setFontSize(12);
      doc.text(`Reporte generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 30);
      
      // Resumen estadístico
      doc.setFontSize(14);
      doc.text('Resumen Estadistico', 20, 45);
      
      doc.setFontSize(10);
      const resumenY = 55;
      doc.text(`Total de ventas: ${ventasFiltradas.length}`, 20, resumenY);
      doc.text(`Ingresos totales: €${ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0).toFixed(2)}`, 20, resumenY + 7);
      doc.text(`Promedio por venta: €${ventasFiltradas.length > 0 ? (ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0) / ventasFiltradas.length).toFixed(2) : '0.00'}`, 20, resumenY + 14);
      doc.text(`Productos vendidos: ${ventasFiltradas.reduce((sum, v) => sum + (v.items?.reduce((itemSum, item) => itemSum + (item.cantidad || 0), 0) || 0), 0)}`, 20, resumenY + 21);
      
      // Filtros aplicados
      if (searchTerm || filtroFecha !== 'todos') {
        doc.text('Filtros aplicados:', 20, resumenY + 35);
        if (searchTerm) {
          doc.text(`- Busqueda: "${searchTerm}"`, 25, resumenY + 42);
        }
        if (filtroFecha !== 'todos') {
          let filtroTexto = '';
          switch(filtroFecha) {
            case 'hoy': filtroTexto = 'Hoy'; break;
            case 'semana': filtroTexto = 'Esta semana'; break;
            case 'mes': filtroTexto = 'Este mes'; break;
            case 'personalizado': filtroTexto = `${fechaInicio} a ${fechaFin}`; break;
          }
          doc.text(`- Periodo: ${filtroTexto}`, 25, resumenY + (searchTerm ? 49 : 42));
        }
      }
      
      // Preparar datos para la tabla
      const tableData = ventasFiltradas.map(venta => [
        venta.id.slice(0, 12) + '...',
        venta.fecha.toLocaleDateString(),
        venta.fecha.toLocaleTimeString(),
        venta.usuario || 'Anonimo',
        (venta.items?.length || 0).toString(),
        (venta.items?.reduce((sum, item) => sum + (item.cantidad || 0), 0) || 0).toString(),
        `€${venta.total?.toFixed(2) || '0.00'}`
      ]);
      
      console.log('Datos de tabla preparados:', tableData.length, 'filas');
      
      // Crear tabla usando autoTable
      autoTable(doc, {
        startY: filtroFecha !== 'todos' || searchTerm ? 100 : 85,
        head: [['ID Venta', 'Fecha', 'Hora', 'Usuario', 'Items', 'Unidades', 'Total']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Azul
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Gris claro
        },
        columnStyles: {
          0: { cellWidth: 25 }, // ID
          1: { cellWidth: 22 }, // Fecha
          2: { cellWidth: 18 }, // Hora
          3: { cellWidth: 30 }, // Usuario
          4: { cellWidth: 15 }, // Items
          5: { cellWidth: 20 }, // Unidades
          6: { cellWidth: 20, halign: 'right' } // Total
        },
        margin: { left: 20, right: 20 },
        didDrawPage: function (data) {
          // Pie de página
          doc.setFontSize(8);
          doc.text(`Página ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
          doc.text('TPV Sistema - Historial de Ventas', doc.internal.pageSize.width - 70, doc.internal.pageSize.height - 10);
        }
      });
      
      // Guardar el PDF
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const nombreArchivo = `historial-ventas-${fechaArchivo}.pdf`;
      
      console.log('Guardando PDF:', nombreArchivo);
      doc.save(nombreArchivo);
      
      console.log('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert(`Error al exportar PDF: ${error.message}`);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const diff = ahora - fecha;
    const diffHours = diff / (1000 * 60 * 60);
    const diffDays = diff / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffHours < 24) {
      return `Hace ${Math.floor(diffHours)} horas`;
    } else if (diffDays < 7) {
      return `Hace ${Math.floor(diffDays)} días`;
    } else {
      return fecha.toLocaleDateString();
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Historial de Ventas</h2>
          <button
            onClick={exportarDatos}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exportar PDF
          </button>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Ventas</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.totalVentas}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Ingresos Total</p>
                <p className="text-2xl font-bold text-green-600">€{estadisticas.ingresoTotal?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Promedio/Venta</p>
                <p className="text-2xl font-bold text-yellow-600">€{estadisticas.promedioVenta?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Clientes</p>
                <p className="text-2xl font-bold text-purple-600">{estadisticas.clientesUnicos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas por período */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Hoy</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Ventas: <span className="font-medium">{estadisticas.totalHoy}</span></p>
              <p className="text-sm text-gray-600">Ingresos: <span className="font-medium">€{estadisticas.ingresoHoy?.toFixed(2)}</span></p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Esta Semana</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Ventas: <span className="font-medium">{estadisticas.totalSemana}</span></p>
              <p className="text-sm text-gray-600">Ingresos: <span className="font-medium">€{estadisticas.ingresoSemana?.toFixed(2)}</span></p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Este Mes</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Ventas: <span className="font-medium">{estadisticas.totalMes}</span></p>
              <p className="text-sm text-gray-600">Ingresos: <span className="font-medium">€{estadisticas.ingresoMes?.toFixed(2)}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, usuario o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todas las fechas</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="personalizado">Rango personalizado</option>
          </select>

          {filtroFecha === 'personalizado' && (
            <>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </>
          )}

          {filtroFecha !== 'personalizado' && (
            <div className="text-sm text-gray-600 flex items-center">
              Mostrando {ventasFiltradas.length} de {ventas.length} ventas
            </div>
          )}
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventasPaginadas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{venta.id.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500">{formatearFecha(venta.fecha)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{venta.fecha.toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{venta.fecha.toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{venta.usuario || 'Usuario anónimo'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {venta.items?.length || 0} productos
                    </div>
                    <div className="text-xs text-gray-500">
                      {venta.items?.reduce((sum, item) => sum + (item.cantidad || 0), 0) || 0} unidades
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600">€{venta.total?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => verDetallesVenta(venta)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, ventasFiltradas.length)}</span> de{' '}
                  <span className="font-medium">{ventasFiltradas.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${page === 1 ? 'rounded-l-md' : ''} ${page === totalPages ? 'rounded-r-md' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {ventasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filtroFecha !== 'todos' 
                ? 'No se encontraron ventas que coincidan con los filtros.' 
                : 'Aún no se han registrado ventas.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles de venta */}
      {modalDetalles && ventaSeleccionada && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Detalles de Venta #{ventaSeleccionada.id.slice(0, 8)}
              </h3>
              <button onClick={cerrarModalDetalles} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID de Venta</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                  <p className="text-sm text-gray-900">
                    {ventaSeleccionada.fecha.toLocaleDateString()} - {ventaSeleccionada.fecha.toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.usuario || 'Usuario anónimo'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total de la Venta</label>
                  <p className="text-2xl font-bold text-green-600">€{ventaSeleccionada.total?.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Productos</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.items?.length || 0} productos diferentes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidades Totales</label>
                  <p className="text-sm text-gray-900">
                    {ventaSeleccionada.items?.reduce((sum, item) => sum + (item.cantidad || 0), 0) || 0} unidades
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Productos Vendidos</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ventaSeleccionada.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{item.nombre}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.codigoBarra}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.cantidad}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">€{item.precio?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          €{item.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="4" className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-2 text-right text-lg font-bold text-green-600">
                        €{ventaSeleccionada.total?.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => exportarVentaPDF(ventaSeleccionada)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exportar PDF
              </button>
              <button
                onClick={cerrarModalDetalles}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasPage;
