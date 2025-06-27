import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  UserIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSecureData } from '../../../contexts/SecureDataContext';

const VentasPage = () => {
  const { secureOnSnapshot, secureDeleteDoc, secureGetDocs, secureUpdateDoc, diagnosticarSistema } = useSecureData();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todos'); // todos, hoy, semana, mes
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);

  // Cargar ventas en tiempo real con contexto seguro
  useEffect(() => {
    setLoading(true);
    
    // Crear listener seguro para ventas (ordenamiento en cliente)
    const unsubscribe = secureOnSnapshot('ventas', [], (ventasData) => {
      // Ordenar por fecha descendente en el cliente
      const ventasOrdenadas = ventasData
        .map(venta => ({
          ...venta,
          fecha: venta.fecha ? new Date(venta.fecha) : new Date(),
          timestamp: venta.timestamp ? venta.timestamp.toDate() : new Date()
        }))
        .sort((a, b) => b.fecha - a.fecha)
        .slice(0, 100); // Limitar a 100 más recientes
      
      setVentas(ventasOrdenadas);
      calcularEstadisticas(ventasOrdenadas.filter(v => !v.eliminada));
      setLoading(false);
    });

    return unsubscribe;
  }, [secureOnSnapshot]);

  // Calcular estadísticas
  const calcularEstadisticas = async (ventasData) => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioAno = new Date(hoy.getFullYear(), 0, 1);

    const ventasHoy = ventasData.filter(v => v.fecha >= inicioHoy);
    const ventasSemana = ventasData.filter(v => v.fecha >= inicioSemana);
    const ventasMes = ventasData.filter(v => v.fecha >= inicioMes);
    const ventasAno = ventasData.filter(v => v.fecha >= inicioAno);

    // Función para calcular beneficios de un conjunto de ventas
    const calcularBeneficios = async (ventas) => {
      let beneficioTotal = 0;
      let costoTotal = 0;
      let ingresoTotal = 0;

      // Obtener todos los productos del usuario una sola vez para optimizar
      let productosUsuario = [];
      try {
        productosUsuario = await secureGetDocs('productos', []);
      } catch (error) {
        console.error('Error obteniendo productos del usuario:', error);
      }

      for (const venta of ventas) {
        ingresoTotal += venta.total || 0;
        
        for (const item of venta.items || []) {
          try {
            // Buscar el producto en los productos del usuario
            const producto = productosUsuario.find(p => p.codigoBarra === item.codigoBarra);
            
            if (producto) {
              const costoUnitario = producto.precioCosto || producto.precio * 0.6; // Si no hay costo, usar 60% del precio como estimación
              const costoItem = costoUnitario * item.cantidad;
              const ingresoItem = item.precio * item.cantidad;
              
              costoTotal += costoItem;
              beneficioTotal += (ingresoItem - costoItem);
            } else {
              // Si no encontramos el producto, usar una estimación conservadora
              const ingresoItem = item.precio * item.cantidad;
              const costoEstimado = ingresoItem * 0.6; // 60% como costo estimado
              costoTotal += costoEstimado;
              beneficioTotal += (ingresoItem - costoEstimado);
            }
          } catch (error) {
            console.error('Error calculando beneficio para item:', item, error);
            // En caso de error, usar estimación conservadora
            const ingresoItem = item.precio * item.cantidad;
            const costoEstimado = ingresoItem * 0.6;
            costoTotal += costoEstimado;
            beneficioTotal += (ingresoItem - costoEstimado);
          }
        }
      }

      return {
        beneficio: beneficioTotal,
        costo: costoTotal,
        ingreso: ingresoTotal,
        margen: ingresoTotal > 0 ? (beneficioTotal / ingresoTotal) * 100 : 0
      };
    };

    // Calcular beneficios para cada período
    const beneficiosHoy = await calcularBeneficios(ventasHoy);
    const beneficiosSemana = await calcularBeneficios(ventasSemana);
    const beneficiosMes = await calcularBeneficios(ventasMes);
    const beneficiosAno = await calcularBeneficios(ventasAno);
    const beneficiosTotal = await calcularBeneficios(ventasData);

    const stats = {
      totalVentas: ventasData.length,
      totalHoy: ventasHoy.length,
      totalSemana: ventasSemana.length,
      totalMes: ventasMes.length,
      totalAno: ventasAno.length,
      
      ingresoTotal: ventasData.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoHoy: ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoSemana: ventasSemana.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoMes: ventasMes.reduce((sum, v) => sum + (v.total || 0), 0),
      ingresoAno: ventasAno.reduce((sum, v) => sum + (v.total || 0), 0),
      
      // Nuevas métricas de beneficio
      beneficioTotal: beneficiosTotal.beneficio,
      beneficioHoy: beneficiosHoy.beneficio,
      beneficioSemana: beneficiosSemana.beneficio,
      beneficioMes: beneficiosMes.beneficio,
      beneficioAno: beneficiosAno.beneficio,
      
      margenTotal: beneficiosTotal.margen,
      margenHoy: beneficiosHoy.margen,
      margenSemana: beneficiosSemana.margen,
      margenMes: beneficiosMes.margen,
      margenAno: beneficiosAno.margen,
      
      costoTotal: beneficiosTotal.costo,
      costoHoy: beneficiosHoy.costo,
      costoSemana: beneficiosSemana.costo,
      costoMes: beneficiosMes.costo,
      costoAno: beneficiosAno.costo,
      
      promedioVenta: ventasData.length > 0 ? ventasData.reduce((sum, v) => sum + (v.total || 0), 0) / ventasData.length : 0,
      ventaMasAlta: Math.max(...ventasData.map(v => v.total || 0), 0),
      
      productosVendidos: ventasData.reduce((sum, v) => sum + (v.items?.reduce((itemSum, item) => itemSum + (item.cantidad || 0), 0) || 0), 0),
      
      totalTickets: ventasData.length // Cada venta es un ticket
    };

    setEstadisticas(stats);
  };

  // Filtrar ventas
  const ventasFiltradas = ventas.filter(venta => {
    // Filtrar por estado (activa o eliminada)
    const estadoVenta = mostrarPapelera ? venta.eliminada === true : venta.eliminada !== true;
    if (!estadoVenta) return false;

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

  // Editar venta
  const editarVenta = (venta) => {
    setVentaEditando({
      ...venta,
      items: venta.items.map(item => ({...item})) // Copia profunda de los items
    });
    setModalEditar(true);
  };

  // Mover venta a papelera
  const eliminarVenta = async (venta) => {
    if (!window.confirm(`¿Mover la venta #${venta.id.slice(0, 8)} a la papelera?\n\nPodrás restaurarla más tarde si es necesario.`)) {
      return;
    }

    try {
      await secureUpdateDoc('ventas', venta.id, {
        eliminada: true,
        fechaEliminacion: new Date().toISOString()
      });
      alert(`🗑️ Venta #${venta.id.slice(0, 8)} movida a la papelera`);
    } catch (error) {
      console.error('Error al mover venta a papelera:', error);
      alert(`❌ Error al mover la venta a papelera: ${error.message}`);
    }
  };

  // Restaurar venta desde papelera
  const restaurarVenta = async (venta) => {
    if (!window.confirm(`¿Restaurar la venta #${venta.id.slice(0, 8)}?\n\nLa venta volverá a aparecer en el historial activo.`)) {
      return;
    }

    try {
      await secureUpdateDoc('ventas', venta.id, {
        eliminada: false,
        fechaRestauracion: new Date().toISOString()
      });
      alert(`♻️ Venta #${venta.id.slice(0, 8)} restaurada exitosamente`);
    } catch (error) {
      console.error('Error al restaurar venta:', error);
      alert(`❌ Error al restaurar la venta: ${error.message}`);
    }
  };

  // Eliminar venta permanentemente
  const eliminarPermanentemente = async (venta) => {
    if (!window.confirm(`⚠️ ¿ELIMINAR PERMANENTEMENTE la venta #${venta.id.slice(0, 8)}?\n\n🚨 ESTA ACCIÓN NO SE PUEDE DESHACER 🚨\n\nLa venta será eliminada para siempre de la base de datos.`)) {
      return;
    }

    // Doble confirmación para eliminar permanentemente
    if (!window.confirm(`🚨 ÚLTIMA CONFIRMACIÓN 🚨\n\n¿Estás completamente seguro de eliminar PERMANENTEMENTE la venta #${venta.id.slice(0, 8)}?\n\nEscribe "ELIMINAR" en la siguiente ventana para confirmar.`)) {
      return;
    }

    const confirmacion = prompt('Para confirmar la eliminación permanente, escribe exactamente: ELIMINAR');
    if (confirmacion !== 'ELIMINAR') {
      alert('❌ Eliminación cancelada. El texto no coincide.');
      return;
    }

    try {
      await secureDeleteDoc('ventas', venta.id);
      alert(`🗑️ Venta #${venta.id.slice(0, 8)} eliminada permanentemente`);
    } catch (error) {
      console.error('Error al eliminar venta permanentemente:', error);
      alert(`❌ Error al eliminar la venta: ${error.message}`);
    }
  };

  // Vaciar papelera completa
  const vaciarPapelera = async () => {
    const ventasEliminadas = ventas.filter(v => v.eliminada === true);
    
    if (ventasEliminadas.length === 0) {
      alert('La papelera ya está vacía.');
      return;
    }

    if (!window.confirm(`⚠️ ¿VACIAR TODA LA PAPELERA?\n\n🚨 Esto eliminará PERMANENTEMENTE ${ventasEliminadas.length} ventas.\n\nESTA ACCIÓN NO SE PUEDE DESHACER.`)) {
      return;
    }

    const confirmacion = prompt(`Para confirmar que quieres eliminar permanentemente ${ventasEliminadas.length} ventas, escribe exactamente: VACIAR PAPELERA`);
    if (confirmacion !== 'VACIAR PAPELERA') {
      alert('❌ Operación cancelada. El texto no coincide.');
      return;
    }

    try {
      let eliminadas = 0;
      for (const venta of ventasEliminadas) {
        await secureDeleteDoc('ventas', venta.id);
        eliminadas++;
      }
      alert(`🗑️ Papelera vaciada. ${eliminadas} ventas eliminadas permanentemente.`);
    } catch (error) {
      console.error('Error al vaciar papelera:', error);
      alert(`❌ Error al vaciar la papelera: ${error.message}`);
    }
  };

  // Guardar cambios en venta editada
  const guardarVentaEditada = async () => {
    if (!ventaEditando) return;

    try {
      // Recalcular el total
      const nuevoTotal = ventaEditando.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      // Actualizar cada item con su subtotal
      const itemsActualizados = ventaEditando.items.map(item => ({
        ...item,
        subtotal: item.precio * item.cantidad
      }));

      const ventaActualizada = {
        ...ventaEditando,
        items: itemsActualizados,
        total: nuevoTotal,
        fechaModificacion: new Date().toISOString()
      };

      await secureUpdateDoc('ventas', ventaEditando.id, ventaActualizada);
      
      setModalEditar(false);
      setVentaEditando(null);
      alert(`✅ Venta #${ventaEditando.id.slice(0, 8)} actualizada exitosamente`);
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      alert(`❌ Error al actualizar la venta: ${error.message}`);
    }
  };

  // Actualizar item en venta editando
  const actualizarItemVenta = (index, campo, valor) => {
    if (!ventaEditando) return;
    
    const itemsActualizados = [...ventaEditando.items];
    itemsActualizados[index] = {
      ...itemsActualizados[index],
      [campo]: campo === 'cantidad' ? parseInt(valor) || 1 : parseFloat(valor) || 0
    };
    
    setVentaEditando({
      ...ventaEditando,
      items: itemsActualizados
    });
  };

  // Eliminar item de venta
  const eliminarItemVenta = (index) => {
    if (!ventaEditando) return;
    
    const itemsActualizados = ventaEditando.items.filter((_, i) => i !== index);
    setVentaEditando({
      ...ventaEditando,
      items: itemsActualizados
    });
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
      doc.text(`Beneficio estimado: €${(estadisticas.beneficioTotal || 0).toFixed(2)}`, 20, resumenY + 14);
      doc.text(`Margen promedio: ${(estadisticas.margenTotal || 0).toFixed(1)}%`, 20, resumenY + 21);
      doc.text(`Promedio por venta: €${ventasFiltradas.length > 0 ? (ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0) / ventasFiltradas.length).toFixed(2) : '0.00'}`, 20, resumenY + 28);
      doc.text(`Productos vendidos: ${ventasFiltradas.reduce((sum, v) => sum + (v.items?.reduce((itemSum, item) => itemSum + (item.cantidad || 0), 0) || 0), 0)}`, 20, resumenY + 35);
      
      // Filtros aplicados
      if (searchTerm || filtroFecha !== 'todos') {
        doc.text('Filtros aplicados:', 20, resumenY + 49);
        if (searchTerm) {
          doc.text(`- Busqueda: "${searchTerm}"`, 25, resumenY + 56);
        }
        if (filtroFecha !== 'todos') {
          let filtroTexto = '';
          switch(filtroFecha) {
            case 'hoy': filtroTexto = 'Hoy'; break;
            case 'semana': filtroTexto = 'Esta semana'; break;
            case 'mes': filtroTexto = 'Este mes'; break;
            case 'personalizado': filtroTexto = `${fechaInicio} a ${fechaFin}`; break;
          }
          doc.text(`- Periodo: ${filtroTexto}`, 25, resumenY + (searchTerm ? 63 : 56));
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
        startY: filtroFecha !== 'todos' || searchTerm ? 114 : 107,
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
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {mostrarPapelera ? 'Papelera de Ventas' : 'Historial de Ventas'}
            </h2>
            <button
              onClick={() => {
                setMostrarPapelera(!mostrarPapelera);
                setCurrentPage(1);
                setSearchTerm('');
              }}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                mostrarPapelera 
                  ? 'text-gray-700 bg-gray-200 hover:bg-gray-300' 
                  : 'text-red-700 bg-red-100 hover:bg-red-200'
              }`}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {mostrarPapelera ? 'Ver Ventas Activas' : `Papelera (${ventas.filter(v => v.eliminada === true).length})`}
            </button>
          </div>
          <div className="flex space-x-3">
            {mostrarPapelera && ventas.filter(v => v.eliminada === true).length > 0 && (
              <button
                onClick={vaciarPapelera}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Vaciar Papelera
              </button>
            )}
            {!mostrarPapelera && (
              <button
                onClick={exportarDatos}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exportar PDF
              </button>
            )}
          </div>
        </div>

        {/* Estadísticas principales - Solo mostrar en vista normal */}
        {!mostrarPapelera && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Ventas</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.totalVentas || 0}</p>
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
                <p className="text-2xl font-bold text-green-600">€{(estadisticas.ingresoTotal || 0).toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-yellow-600">€{(estadisticas.promedioVenta || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ReceiptPercentIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-indigo-900">Total Tickets</p>
                <p className="text-2xl font-bold text-indigo-600">{estadisticas.totalTickets || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-emerald-900">Beneficio Total</p>
                <p className="text-2xl font-bold text-emerald-600">€{(estadisticas.beneficioTotal || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Margen Total</p>
                <p className="text-2xl font-bold text-purple-600">{(estadisticas.margenTotal || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas por período */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">📅 Hoy</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ventas:</span>
                <span className="text-sm font-medium">{estadisticas.totalHoy || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">€{(estadisticas.ingresoHoy || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Beneficio:</span>
                <span className="text-sm font-bold text-emerald-600">€{(estadisticas.beneficioHoy || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Margen:</span>
                <span className={`text-sm font-bold ${
                  (estadisticas.margenHoy || 0) > 30 ? 'text-green-600' : 
                  (estadisticas.margenHoy || 0) > 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(estadisticas.margenHoy || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">📊 Esta Semana</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ventas:</span>
                <span className="text-sm font-medium">{estadisticas.totalSemana || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">€{(estadisticas.ingresoSemana || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Beneficio:</span>
                <span className="text-sm font-bold text-emerald-600">€{(estadisticas.beneficioSemana || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Margen:</span>
                <span className={`text-sm font-bold ${
                  (estadisticas.margenSemana || 0) > 30 ? 'text-green-600' : 
                  (estadisticas.margenSemana || 0) > 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(estadisticas.margenSemana || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">📈 Este Mes</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ventas:</span>
                <span className="text-sm font-medium">{estadisticas.totalMes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">€{(estadisticas.ingresoMes || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Beneficio:</span>
                <span className="text-sm font-bold text-emerald-600">€{(estadisticas.beneficioMes || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Margen:</span>
                <span className={`text-sm font-bold ${
                  (estadisticas.margenMes || 0) > 30 ? 'text-green-600' : 
                  (estadisticas.margenMes || 0) > 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(estadisticas.margenMes || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">🗓️ Este Año</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ventas:</span>
                <span className="text-sm font-medium">{estadisticas.totalAno || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">€{(estadisticas.ingresoAno || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Beneficio:</span>
                <span className="text-sm font-bold text-emerald-600">€{(estadisticas.beneficioAno || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Margen:</span>
                <span className={`text-sm font-bold ${
                  (estadisticas.margenAno || 0) > 30 ? 'text-green-600' : 
                  (estadisticas.margenAno || 0) > 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(estadisticas.margenAno || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Rendimiento y Análisis */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
            📊 Análisis de Rendimiento
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Indicador de Margen */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  (estadisticas.margenTotal || 0) > 30 ? 'text-green-600' : 
                  (estadisticas.margenTotal || 0) > 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(estadisticas.margenTotal || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mb-2">Margen de Beneficio</div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  (estadisticas.margenTotal || 0) > 30 ? 'bg-green-100 text-green-800' : 
                  (estadisticas.margenTotal || 0) > 15 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {(estadisticas.margenTotal || 0) > 30 ? '🟢 Excelente' : 
                   (estadisticas.margenTotal || 0) > 15 ? '🟡 Bueno' : '🔴 Mejorable'}
                </div>
              </div>
            </div>

            {/* Eficiencia de Costos */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  €{((estadisticas.costoTotal || 0) / Math.max(estadisticas.totalVentas || 1, 1)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mb-2">Costo Promedio/Venta</div>
                <div className="text-xs text-gray-500">
                  Del total: €{(estadisticas.costoTotal || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* ROI (Return on Investment) */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${
                  ((estadisticas.beneficioTotal || 0) / Math.max(estadisticas.costoTotal || 1, 1)) > 1 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {(((estadisticas.beneficioTotal || 0) / Math.max(estadisticas.costoTotal || 1, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 mb-2">ROI (Retorno)</div>
                <div className="text-xs text-gray-500">
                  Por cada €1 invertido
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
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
              {ventasPaginadas.length > 0 ? (
                ventasPaginadas.map((venta) => (
                <tr key={venta.id} className={`hover:bg-gray-50 ${venta.eliminada ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">#{venta.id.slice(0, 8)}</div>
                      {venta.eliminada && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Eliminada
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mostrarPapelera && venta.fechaEliminacion 
                        ? `Eliminada: ${new Date(venta.fechaEliminacion).toLocaleDateString()}`
                        : formatearFecha(venta.fecha)
                      }
                    </div>
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
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => verDetallesVenta(venta)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {mostrarPapelera ? (
                        <>
                          <button
                            onClick={() => restaurarVenta(venta)}
                            className="text-green-600 hover:text-green-900"
                            title="Restaurar venta"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 transform rotate-180" />
                          </button>
                          <button
                            onClick={() => eliminarPermanentemente(venta)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar permanentemente"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => editarVenta(venta)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Editar venta"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarVenta(venta)}
                            className="text-red-600 hover:text-red-900"
                            title="Mover a papelera"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {mostrarPapelera ? 'No hay ventas en la papelera' : 'No hay ventas'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {mostrarPapelera 
                        ? 'La papelera está vacía. Las ventas eliminadas aparecerán aquí.' 
                        : searchTerm || filtroFecha !== 'todos' 
                          ? 'No se encontraron ventas que coincidan con los filtros.' 
                          : 'Aún no se han registrado ventas.'
                      }
                    </p>
                  </td>
                </tr>
              )}
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

      {/* Modal de edición de venta */}
      {modalEditar && ventaEditando && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Venta #{ventaEditando.id.slice(0, 8)}
              </h3>
              <button 
                onClick={() => {
                  setModalEditar(false);
                  setVentaEditando(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID de Venta</label>
                  <p className="text-sm text-gray-900">{ventaEditando.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Original</label>
                  <p className="text-sm text-gray-900">
                    {ventaEditando.fecha.toLocaleDateString()} - {ventaEditando.fecha.toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario</label>
                  <input
                    type="text"
                    value={ventaEditando.usuario || ''}
                    onChange={(e) => setVentaEditando({...ventaEditando, usuario: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Actual</label>
                  <p className="text-2xl font-bold text-green-600">
                    €{ventaEditando.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Productos</label>
                  <p className="text-sm text-gray-900">{ventaEditando.items.length} productos diferentes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidades Totales</label>
                  <p className="text-sm text-gray-900">
                    {ventaEditando.items.reduce((sum, item) => sum + (item.cantidad || 0), 0)} unidades
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Productos en la Venta</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ventaEditando.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.nombre}
                            onChange={(e) => actualizarItemVenta(index, 'nombre', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.codigoBarra}
                            onChange={(e) => actualizarItemVenta(index, 'codigoBarra', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => actualizarItemVenta(index, 'cantidad', e.target.value)}
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.precio}
                            onChange={(e) => actualizarItemVenta(index, 'precio', e.target.value)}
                            className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                          €{(item.precio * item.cantidad).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => eliminarItemVenta(index)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar producto"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
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
                        €{ventaEditando.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <div className="text-xs text-gray-500">
                ⚠️ Los cambios en las ventas pueden afectar las estadísticas y reportes.
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => {
                    setModalEditar(false);
                    setVentaEditando(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarVentaEditada}
                  disabled={!ventaEditando.items.length}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasPage;
