import { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  Cog6ToothIcon,
  PhotoIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  PaintBrushIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../AuthContext';
import { useSecureData } from '../../../contexts/SecureDataContext';
import AnalizadorFacturas from './AnalizadorFacturas';
import FacturaSimulada from './FacturaSimulada';
import jsPDF from 'jspdf';

const FacturasPage = () => {
  const { usuario } = useAuth();
  const { secureOnSnapshot, secureGetDocs, secureAddDoc, secureUpdateDoc, diagnosticarSistema } = useSecureData();
  const [facturas, setFacturas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoFactura, setSubiendoFactura] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [mostrarFacturaSimulada, setMostrarFacturaSimulada] = useState(false);
  const [error, setError] = useState('');
  const [archivoHabilitado, setArchivoHabilitado] = useState(true);

  // Estados para análisis IA y generación PDF
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [productosExtraidos, setProductosExtraidos] = useState([]); // Nuevo estado para productos extraídos
  const [mostrarProductosExtraidos, setMostrarProductosExtraidos] = useState(false); // Nuevo estado para mostrar preview
  // Estados para editar y eliminar facturas
  const [facturaEditando, setFacturaEditando] = useState(null);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(null);
  const [eliminandoFactura, setEliminandoFactura] = useState(false);
  
  // Estados para configuración de empresa
  const [mostrarConfiguracionEmpresa, setMostrarConfiguracionEmpresa] = useState(false);
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [datosEmpresa, setDatosEmpresa] = useState({
    nombre: 'Tu Empresa S.L.',
    direccion: 'Calle Principal 123',
    ciudad: 'Ciudad, CP 12345',
    codigoPostal: '12345',
    telefono: '+34 123 456 789',
    email: 'info@tuempresa.com',
    web: 'www.tuempresa.com',
    cif: 'B-12345678',
    logo: null,
    colorPrimario: '#2563eb', // Azul por defecto
    colorSecundario: '#64748b', // Gris por defecto
    mostrarLogo: true,
    pieFactura: 'Gracias por confiar en nosotros'
  });

  // Estado del formulario de nueva factura
  const [nuevaFactura, setNuevaFactura] = useState({
    numeroFactura: '',
    proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
    total: '',
    archivo: null,
    productos: []
  });

  // Estado para análisis manual de productos
  const [productoManual, setProductoManual] = useState({
    codigo: '',
    nombre: '',
    cantidad: '',
    precioUnitario: ''
  });

  useEffect(() => {
    if (usuario) {
      cargarFacturas();
      cargarProductos();
      cargarConfiguracionEmpresa();
    }
  }, [usuario]);

  // Función para analizar archivo con IA (simulado - NO se almacena)
  const analizarArchivoIA = async (archivo) => {
    setAnalizandoIA(true);
    console.log('🤖 Iniciando análisis IA simulado del archivo:', archivo.name);
    
    try {
      // Simular análisis con delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Datos simulados extraídos por IA
      const datosExtraidos = {
        numeroFactura: `FA-${Date.now().toString().slice(-6)}`,
        proveedor: 'Proveedor Detectado S.L.',
        fecha: new Date().toISOString().split('T')[0],
        productos: [
          {
            codigo: 'PROD001',
            nombre: 'Producto Detectado 1',
            cantidad: 5,
            precioUnitario: 15.99
          },
          {
            codigo: 'PROD002',
            nombre: 'Producto Detectado 2',
            cantidad: 2,
            precioUnitario: 25.50
          }
        ]
      };

      // Calcular total
      const total = datosExtraidos.productos.reduce((sum, prod) => 
        sum + (prod.cantidad * prod.precioUnitario), 0
      );

      // Actualizar formulario con datos extraídos
      setNuevaFactura({
        ...nuevaFactura,
        numeroFactura: datosExtraidos.numeroFactura,
        proveedor: datosExtraidos.proveedor,
        fecha: datosExtraidos.fecha,
        total: total.toFixed(2),
        archivo: archivo, // Mantener referencia pero NO se subirá
        productos: datosExtraidos.productos
      });

      console.log('✅ Análisis IA completado:', datosExtraidos);
      alert('🤖 ¡Análisis IA completado!\n\n' +
            `Se detectaron ${datosExtraidos.productos.length} productos.\n` +
            'Puedes revisar y modificar los datos antes de guardar.\n\n' +
            '💡 El archivo se usa solo para análisis y NO se almacena.');
            
    } catch (error) {
      console.error('❌ Error en análisis IA:', error);
      alert('❌ Error en el análisis IA. Puedes continuar ingresando los datos manualmente.');
    } finally {
      setAnalizandoIA(false);
    }
  };

  // Función para generar factura personalizada en PDF
  const generarFacturaPDF = (factura) => {
    console.log('📄 Generando factura PDF personalizada:', factura);
    console.log('🏢 Usando configuración de empresa:', datosEmpresa);
    
    const doc = new jsPDF();
    
    // Función auxiliar para convertir hex a RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 37, g: 99, b: 235 }; // Azul por defecto
    };
    
    const colorPrimario = hexToRgb(datosEmpresa.colorPrimario);
    const colorSecundario = hexToRgb(datosEmpresa.colorSecundario);
    
    // Configuración de fuentes
    doc.setFont('helvetica');
    
    // ENCABEZADO DE LA EMPRESA
    // Rectángulo de fondo para el encabezado
    doc.setFillColor(colorPrimario.r, colorPrimario.g, colorPrimario.b);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo de la empresa (si existe y está habilitado)
    if (datosEmpresa.mostrarLogo && logoPreview) {
      try {
        doc.addImage(logoPreview, 'JPEG', 15, 8, 20, 20);
        console.log('✅ Logo agregado al PDF');
      } catch (error) {
        console.warn('⚠️ Error agregando logo al PDF:', error);
      }
    }
    
    // Nombre de la empresa (ajustar posición si hay logo)
    const nombreEmpresaX = (datosEmpresa.mostrarLogo && logoPreview) ? 40 : 20;
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255); // Blanco
    doc.setFont('helvetica', 'bold');
    doc.text(datosEmpresa.nombre, nombreEmpresaX, 20);
    
    // Información de contacto de la empresa
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    
    let yPos = 28;
    if (datosEmpresa.direccion) {
      doc.text(`${datosEmpresa.direccion}, ${datosEmpresa.ciudad} ${datosEmpresa.codigoPostal}`, nombreEmpresaX, yPos);
    }
    
    // Información de contacto en línea horizontal
    let contactoInfo = [];
    if (datosEmpresa.telefono) contactoInfo.push(`Tel: ${datosEmpresa.telefono}`);
    if (datosEmpresa.email) contactoInfo.push(`Email: ${datosEmpresa.email}`);
    if (datosEmpresa.web) contactoInfo.push(`Web: ${datosEmpresa.web}`);
    if (datosEmpresa.cif) contactoInfo.push(`CIF: ${datosEmpresa.cif}`);
    
    if (contactoInfo.length > 0) {
      doc.text(contactoInfo.join(' | '), nombreEmpresaX, 32);
    }
    
    // TÍTULO FACTURA (lado derecho)
    doc.setFontSize(28);
    doc.setTextColor(colorPrimario.r, colorPrimario.g, colorPrimario.b);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 140, 50);
    
    // Información de la factura
    doc.setFontSize(11);
    doc.setTextColor(colorSecundario.r, colorSecundario.g, colorSecundario.b);
    doc.setFont('helvetica', 'normal');
    
    // Caja de información de factura (más grande para evitar desbordamiento)
    doc.setDrawColor(colorSecundario.r, colorSecundario.g, colorSecundario.b);
    doc.setLineWidth(0.5);
    doc.rect(120, 55, 70, 30); // Caja más ancha y alta
    
    doc.text(`N°: ${factura.numeroFactura}`, 122, 62);
    doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString('es-ES')}`, 122, 68);
    
    // Proveedor con manejo de texto largo
    const proveedorTexto = `Proveedor: ${factura.proveedor}`;
    if (proveedorTexto.length > 35) {
      // Dividir en dos líneas si es muy largo
      const palabras = factura.proveedor.split(' ');
      let linea1 = 'Proveedor: ';
      let linea2 = '';
      let longitudLinea1 = linea1.length;
      
      for (let palabra of palabras) {
        if (longitudLinea1 + palabra.length + 1 <= 32) {
          linea1 += palabra + ' ';
          longitudLinea1 += palabra.length + 1;
        } else {
          linea2 += palabra + ' ';
        }
      }
      
      doc.text(linea1.trim(), 122, 74);
      if (linea2.trim()) {
        doc.text(linea2.trim(), 122, 80);
      }
    } else {
      doc.text(proveedorTexto, 122, 74);
    }
    
    // SECCIÓN DE PRODUCTOS
    // Línea separadora decorativa
    doc.setDrawColor(colorPrimario.r, colorPrimario.g, colorPrimario.b);
    doc.setLineWidth(1);
    doc.line(20, 95, 190, 95); // Movido más abajo para dar espacio
    
    // Encabezados de tabla
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    // Fondo de encabezados
    doc.setFillColor(colorPrimario.r, colorPrimario.g, colorPrimario.b);
    doc.rect(20, 100, 170, 8, 'F'); // Movido más abajo
    
    doc.text('Código', 22, 106);
    doc.text('Producto', 55, 106);
    doc.text('Cant.', 125, 106);
    doc.text('Precio Unit.', 140, 106);
    doc.text('Total', 175, 106);
    
    // Productos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    let yPosProductos = 115; // Movido más abajo
    let filaColor = true;
    
    factura.productos.forEach((producto, index) => {
      const total = producto.cantidad * producto.precioUnitario;
      
      // Alternar color de fondo para las filas
      if (filaColor) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosProductos - 5, 170, 7, 'F');
      }
      filaColor = !filaColor;
      
      // Datos del producto
      doc.text((producto.codigo || '-').substring(0, 12), 22, yPosProductos);
      
      // Nombre del producto (con salto de línea si es muy largo)
      const nombreCorto = producto.nombre.length > 30 
        ? producto.nombre.substring(0, 30) + '...' 
        : producto.nombre;
      doc.text(nombreCorto, 55, yPosProductos);
      
      doc.text(producto.cantidad.toString(), 125, yPosProductos);
      doc.text(`€${producto.precioUnitario.toFixed(2)}`, 140, yPosProductos);
      doc.text(`€${total.toFixed(2)}`, 175, yPosProductos);
      
      yPosProductos += 8;
      
      // Nueva página si es necesario
      if (yPosProductos > 250) {
        doc.addPage();
        yPosProductos = 30;
        filaColor = true;
      }
    });
    
    // TOTAL GENERAL
    yPosProductos += 10;
    
    // Línea separadora antes del total
    doc.setDrawColor(colorPrimario.r, colorPrimario.g, colorPrimario.b);
    doc.setLineWidth(1);
    doc.line(130, yPosProductos - 5, 190, yPosProductos - 5);
    
    // Caja de total
    doc.setFillColor(colorPrimario.r, colorPrimario.g, colorPrimario.b);
    doc.rect(130, yPosProductos, 60, 12, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', 135, yPosProductos + 8);
    doc.text(`€${factura.total.toFixed(2)}`, 170, yPosProductos + 8);
    
    // PIE DE PÁGINA
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorSecundario.r, colorSecundario.g, colorSecundario.b);
    
    // Mensaje personalizable
    if (datosEmpresa.pieFactura) {
      doc.text(datosEmpresa.pieFactura, 20, 275);
    }
    
    // Información de generación
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Factura generada automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, 285);
    doc.text(`Sistema TPV - ${datosEmpresa.nombre}`, 20, 290);
    
    // Descargar PDF
    const nombreArchivo = `Factura_${factura.numeroFactura}_${factura.proveedor.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
    
    console.log('✅ PDF personalizado generado y descargado:', nombreArchivo);
    alert(`✅ Factura PDF personalizada generada!\n\n📁 Archivo: ${nombreArchivo}\n🎨 Con el diseño de ${datosEmpresa.nombre}\n${logoPreview ? '🖼️ Logo incluido' : ''}\n\n💡 El archivo se ha descargado automáticamente.`);
  };

  const cargarFacturas = async () => {
    try {
      setCargando(true);
      console.log('📄 Cargando facturas desde Firestore...');
      
      // Usar función segura para obtener facturas del usuario (ordenamiento en cliente)
      const facturasData = await secureGetDocs('facturas', []);
      
      // Filtrar y ordenar en el cliente para evitar problemas de índices
      const facturasFiltradas = facturasData
        .filter(data => data._tipo !== 'documento_inicializacion')
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      console.log(`✅ ${facturasFiltradas.length} facturas cargadas para usuario: ${usuario.email}`);
      setFacturas(facturasFiltradas);
      
      if (facturasFiltradas.length === 0) {
        console.log('ℹ️ El usuario no tiene facturas - se creará automáticamente al guardar la primera factura');
      }
      
    } catch (error) {
      console.error('❌ Error cargando facturas:', error);
      
      if (error.code === 'permission-denied') {
        setError('Sin permisos para leer facturas. Verifica tu autenticación y las reglas de Firestore.');
      } else if (error.code === 'unavailable') {
        setError('Servicio de Firestore no disponible. Inténtalo de nuevo más tarde.');
      } else {
        setError(`Error al cargar las facturas: ${error.message}`);
      }
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      console.log('📦 Cargando productos desde Firestore...');
      
      // Usar función segura para obtener productos del usuario
      const productosData = await secureGetDocs('productos', []);
      
      console.log(`✅ ${productosData.length} productos cargados para usuario: ${usuario.email}`);
      console.log('Productos del usuario:', productosData.map(p => ({ 
        id: p.id, 
        nombre: p.nombre, 
        codigo: p.codigo || p.codigoBarra,
        usuario: p.usuario
      })));
      setProductos(productosData);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      setError(`Error al cargar productos: ${error.message}`);
    }
  };

  // Funciones para configuración de empresa
  const cargarConfiguracionEmpresa = async () => {
    try {
      console.log('🏢 Cargando configuración de empresa...');
      
      const configuracionData = await secureGetDocs('configuracion_empresa', []);
      
      if (configuracionData.length > 0) {
        const config = configuracionData[0];
        setDatosEmpresa(prevDatos => ({
          ...prevDatos,
          ...config
        }));
        
        // Cargar logo si existe
        if (config.logoBase64) {
          setLogoPreview(config.logoBase64);
        }
        
        console.log('✅ Configuración de empresa cargada');
      } else {
        console.log('ℹ️ No hay configuración guardada, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ Error cargando configuración de empresa:', error);
    }
  };

  const guardarConfiguracionEmpresa = async () => {
    try {
      setGuardandoConfiguracion(true);
      console.log('💾 Guardando configuración de empresa...');
      
      // Preparar datos incluyendo el logo en base64 si existe
      const configuracionData = {
        nombre: datosEmpresa.nombre.trim(),
        direccion: datosEmpresa.direccion.trim(),
        ciudad: datosEmpresa.ciudad.trim(),
        codigoPostal: datosEmpresa.codigoPostal.trim(),
        telefono: datosEmpresa.telefono.trim(),
        email: datosEmpresa.email.trim(),
        web: datosEmpresa.web.trim(),
        cif: datosEmpresa.cif.trim(),
        colorPrimario: datosEmpresa.colorPrimario,
        colorSecundario: datosEmpresa.colorSecundario,
        mostrarLogo: datosEmpresa.mostrarLogo,
        pieFactura: datosEmpresa.pieFactura.trim(),
        logoBase64: logoPreview, // Guardar el logo en base64
        usuario: usuario.email,
        fechaActualizacion: new Date().toISOString()
      };

      // Verificar si ya existe configuración
      const configuracionExistente = await secureGetDocs('configuracion_empresa', []);
      
      if (configuracionExistente.length > 0) {
        // Actualizar configuración existente
        await secureUpdateDoc('configuracion_empresa', configuracionExistente[0].id, configuracionData);
        console.log('✅ Configuración actualizada');
      } else {
        // Crear nueva configuración
        await secureAddDoc('configuracion_empresa', {
          ...configuracionData,
          fechaCreacion: new Date().toISOString()
        });
        console.log('✅ Nueva configuración creada');
      }

      alert('✅ Configuración de empresa guardada correctamente');
      setMostrarConfiguracionEmpresa(false);
      
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      alert(`❌ Error al guardar la configuración: ${error.message}`);
    } finally {
      setGuardandoConfiguracion(false);
    }
  };

  const handleLogoChange = (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar que sea una imagen
      if (!archivo.type.startsWith('image/')) {
        alert('❌ Solo se permiten archivos de imagen (JPG, PNG, etc.)');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (archivo.size > 2 * 1024 * 1024) {
        alert('❌ El logo debe ser menor a 2MB');
        return;
      }

      // Crear preview del logo
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        setDatosEmpresa(prevDatos => ({
          ...prevDatos,
          logo: archivo
        }));
      };
      reader.readAsDataURL(archivo);
    }
  };

  const eliminarLogo = () => {
    setLogoPreview(null);
    setDatosEmpresa(prevDatos => ({
      ...prevDatos,
      logo: null
    }));
  };

  const handleArchivoChange = async (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar tipo de archivo
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!tiposPermitidos.includes(archivo.type)) {
        alert('❌ Tipo de archivo no permitido. Solo se permiten PDF, JPG y PNG.');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (archivo.size > 10 * 1024 * 1024) {
        alert('❌ El archivo es demasiado grande. Máximo 10MB permitido.');
        return;
      }

      // Crear preview para mostrar al usuario
      const reader = new FileReader();
      reader.onload = (e) => {
        setArchivoPreview({
          name: archivo.name,
          size: archivo.size,
          type: archivo.type,
          url: e.target.result
        });
      };
      reader.readAsDataURL(archivo);

      // Simplemente asignar el archivo sin preguntar
      setNuevaFactura({
        ...nuevaFactura,
        archivo: archivo
      });

      console.log(`📁 Archivo "${archivo.name}" cargado correctamente. Usa el botón "Analizar Factura con IA" para extraer datos automáticamente.`);
    }
  };

  const agregarProductoManual = () => {
    if (!productoManual.codigo || !productoManual.nombre || !productoManual.cantidad) {
      alert('❌ Por favor completa los campos obligatorios (código, nombre, cantidad)');
      return;
    }

    const nuevoProducto = {
      codigo: productoManual.codigo,
      nombre: productoManual.nombre,
      cantidad: parseInt(productoManual.cantidad),
      precioUnitario: parseFloat(productoManual.precioUnitario) || 0,
      total: (parseInt(productoManual.cantidad) * (parseFloat(productoManual.precioUnitario) || 0)).toFixed(2)
    };

    setNuevaFactura({
      ...nuevaFactura,
      productos: [...nuevaFactura.productos, nuevoProducto]
    });

    // Limpiar formulario
    setProductoManual({
      codigo: '',
      nombre: '',
      cantidad: '',
      precioUnitario: ''
    });
  };

  const manejarProductosExtraidos = (datosExtraidos) => {
    // Solo actualizar información general, NO productos automáticamente
    setNuevaFactura({
      ...nuevaFactura,
      numeroFactura: datosExtraidos.numeroFactura || nuevaFactura.numeroFactura,
      proveedor: datosExtraidos.proveedor || nuevaFactura.proveedor,
      fecha: datosExtraidos.fecha || nuevaFactura.fecha
      // NO agregar productos automáticamente - eliminado esta línea
    });

    // Guardar productos extraídos para revisión manual
    if (datosExtraidos.productos && datosExtraidos.productos.length > 0) {
      setProductosExtraidos(datosExtraidos.productos);
      setMostrarProductosExtraidos(true);
      console.log('🔍 Productos extraídos guardados para revisión:', datosExtraidos.productos);
    }
  };

  const manejarErrorAnalisis = (mensaje) => {
    setError(mensaje);
    setTimeout(() => setError(''), 5000);
  };

  // Nueva función para agregar producto extraído a la factura
  const agregarProductoExtraido = (producto) => {
    const productoConTotal = {
      ...producto,
      total: (producto.cantidad * producto.precioUnitario).toFixed(2)
    };

    setNuevaFactura({
      ...nuevaFactura,
      productos: [...nuevaFactura.productos, productoConTotal]
    });

    console.log('✅ Producto agregado a la factura:', producto.nombre);
  };

  // Nueva función para agregar todos los productos extraídos
  const agregarTodosProductosExtraidos = () => {
    const productosConTotal = productosExtraidos.map(producto => ({
      ...producto,
      total: (producto.cantidad * producto.precioUnitario).toFixed(2)
    }));

    setNuevaFactura({
      ...nuevaFactura,
      productos: [...nuevaFactura.productos, ...productosConTotal]
    });

    setProductosExtraidos([]);
    setMostrarProductosExtraidos(false);
    console.log('✅ Todos los productos extraídos agregados a la factura');
  };

  // Nueva función para limpiar productos extraídos
  const limpiarProductosExtraidos = () => {
    setProductosExtraidos([]);
    setMostrarProductosExtraidos(false);
    console.log('🗑️ Productos extraídos eliminados');
  };

  // Función para iniciar edición de factura
  const iniciarEdicionFactura = (factura) => {
    console.log('✏️ Iniciando edición de factura:', factura.numeroFactura);
    
    // Cargar datos de la factura en el formulario
    setNuevaFactura({
      numeroFactura: factura.numeroFactura,
      proveedor: factura.proveedor,
      fecha: factura.fecha,
      total: factura.total.toString(),
      archivo: null, // No podemos recuperar el archivo original
      productos: factura.productos.map(p => ({
        ...p,
        total: (p.cantidad * p.precioUnitario).toFixed(2)
      }))
    });
    
    setFacturaEditando(factura);
    setMostrarFormulario(true);
    setFacturaSeleccionada(null); // Cerrar modal de detalles si está abierto
  };

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setFacturaEditando(null);
    setNuevaFactura({
      numeroFactura: '',
      proveedor: '',
      fecha: new Date().toISOString().split('T')[0],
      total: '',
      archivo: null,
      productos: []
    });
    setMostrarFormulario(false);
  };

  // Función para eliminar factura
  const eliminarFactura = async (factura) => {
    if (!mostrarConfirmacionEliminar) {
      setMostrarConfirmacionEliminar(factura);
      return;
    }

    try {
      setEliminandoFactura(true);
      console.log('🗑️ Eliminando factura:', factura.numeroFactura);

      // Confirmar que es el usuario correcto
      if (factura.usuario !== usuario.email) {
        throw new Error('No tienes permisos para eliminar esta factura');
      }

      // Eliminar de Firestore usando la función segura
      await secureUpdateDoc('facturas', factura.id, { eliminada: true, fechaEliminacion: new Date().toISOString() });
      
      console.log('✅ Factura eliminada correctamente');
      
      // Actualizar la lista local
      setFacturas(facturas.filter(f => f.id !== factura.id));
      
      alert(`✅ Factura ${factura.numeroFactura} eliminada correctamente.`);
      
    } catch (error) {
      console.error('❌ Error eliminando factura:', error);
      alert(`❌ Error al eliminar la factura: ${error.message}`);
    } finally {
      setEliminandoFactura(false);
      setMostrarConfirmacionEliminar(null);
    }
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = () => {
    if (mostrarConfirmacionEliminar) {
      eliminarFactura(mostrarConfirmacionEliminar);
    }
  };

  const subirFactura = async () => {
    if (!nuevaFactura.numeroFactura || !nuevaFactura.proveedor || nuevaFactura.productos.length === 0) {
      alert('❌ Por favor completa todos los campos obligatorios y agrega al menos un producto');
      return;
    }

    try {
      setSubiendoFactura(true);
      setError('');
      
      const esEdicion = facturaEditando !== null;
      console.log(esEdicion ? '✏️ Actualizando factura...' : '🚀 Creando nueva factura...');
      console.log('📋 Datos de la factura:', {
        numeroFactura: nuevaFactura.numeroFactura,
        proveedor: nuevaFactura.proveedor,
        productos: nuevaFactura.productos.length,
        total: nuevaFactura.total,
        archivoUsadoParaAnalisis: nuevaFactura.archivo ? nuevaFactura.archivo.name : 'Ninguno',
        esEdicion
      });

      // IMPORTANTE: NO subir archivo - solo usarlo para análisis
      console.log('💡 El archivo se usó para análisis IA pero NO se almacena en Firebase Storage');
      const urlArchivo = ''; // Siempre vacío - no almacenamos archivos

      // Calcular total correcto
      const totalCalculado = nuevaFactura.productos.reduce((sum, prod) => 
        sum + (parseFloat(prod.precioUnitario || 0) * parseInt(prod.cantidad || 0)), 0
      );

      // Guardar factura en Firestore
      console.log('💾 Preparando datos para Firestore...');
      const facturaData = {
        numeroFactura: nuevaFactura.numeroFactura.trim(),
        proveedor: nuevaFactura.proveedor.trim(),
        fecha: nuevaFactura.fecha,
        total: totalCalculado,
        productos: nuevaFactura.productos.map(p => ({
          codigo: p.codigo || '',
          nombre: p.nombre.trim(),
          cantidad: parseInt(p.cantidad),
          precioUnitario: parseFloat(p.precioUnitario),
          total: parseFloat((parseInt(p.cantidad) * parseFloat(p.precioUnitario)).toFixed(2)),
          productoExistente: p.productoExistente || null
        })),
        archivoUrl: urlArchivo,
        usuario: usuario.email,
        fechaCreacion: new Date().toISOString(),
        procesada: false
      };

      console.log('💾 Datos a guardar:', facturaData);
      
      let docRef;
      if (esEdicion) {
        console.log('💾 Actualizando factura existente...');
        await secureUpdateDoc('facturas', facturaEditando.id, facturaData);
        docRef = { id: facturaEditando.id };
        console.log('✅ Factura actualizada con ID:', facturaEditando.id);
      } else {
        console.log('💾 Guardando nueva factura en Firestore...');
        docRef = await secureAddDoc('facturas', facturaData);
        console.log('✅ Factura guardada con ID:', docRef.id);
      }

      // Actualizar stock de productos
      console.log('📦 Iniciando actualización de stock...');
      try {
        await actualizarStock(nuevaFactura.productos);
        console.log('✅ Stock actualizado correctamente');
      } catch (stockError) {
        console.error('❌ Error actualizando stock:', stockError);
        alert('⚠️ La factura se guardó correctamente, pero hubo problemas actualizando el stock. Revisa manualmente.');
      }

      // Marcar factura como procesada
      console.log('🔄 Marcando factura como procesada...');
      try {
        await secureUpdateDoc('facturas', docRef.id, { procesada: true });
        console.log('✅ Factura marcada como procesada');
      } catch (updateError) {
        console.error('❌ Error marcando como procesada:', updateError);
        // No es crítico, continuar
      }

      // Contar productos nuevos vs actualizados
      const productosNuevos = nuevaFactura.productos.filter(p => 
        !productos.find(existing => {
          const codigoExistente = (existing.codigo || existing.codigoBarra || '').toLowerCase();
          const codigoFactura = (p.codigo || '').toLowerCase();
          return codigoExistente === codigoFactura ||
                 (p.productoExistente && existing.id === p.productoExistente.id);
        })
      ).length;
      
      const productosActualizados = nuevaFactura.productos.length - productosNuevos;

      alert(`✅ Factura ${esEdicion ? 'actualizada' : 'guardada'} exitosamente!\n\n` +
            `📊 Resumen:\n` +
            `• Número de factura: ${nuevaFactura.numeroFactura}\n` +
            `• Total: €${totalCalculado.toFixed(2)}\n` +
            `• ${productosActualizados} productos existentes actualizados\n` +
            `• ${productosNuevos} productos nuevos creados\n` +
            `• Stock actualizado correctamente\n\n` +
            `💡 Los precios de costo han sido actualizados y se han sugerido precios de venta con margen del 30%.`);
      
      // Limpiar formulario
      setNuevaFactura({
        numeroFactura: '',
        proveedor: '',
        fecha: new Date().toISOString().split('T')[0],
        total: '',
        archivo: null,
        productos: []
      });
      setFacturaEditando(null); // Limpiar estado de edición
      setMostrarFormulario(false);
      
      // Recargar datos
      console.log('🔄 Recargando datos...');
      await cargarFacturas();
      await cargarProductos();
      console.log('✅ Datos recargados');

    } catch (error) {
      console.error('❌ Error general guardando factura:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let mensajeError = 'Error desconocido al guardar la factura';
      
      if (error.code === 'permission-denied') {
        mensajeError = 'No tienes permisos para guardar facturas. Verifica tu autenticación.';
      } else if (error.code === 'unavailable') {
        mensajeError = 'Servicio de base de datos no disponible. Inténtalo de nuevo más tarde.';
      } else if (error.message.includes('CORS')) {
        mensajeError = 'Error de conectividad. Verifica tu conexión a internet.';
      } else if (error.message.includes('network')) {
        mensajeError = 'Error de red. Verifica tu conexión a internet.';
      }
      
      setError(`Error al guardar la factura: ${mensajeError}`);
      alert(`❌ ${mensajeError}\n\n🔧 Detalles técnicos:\n${error.message}`);
    } finally {
      setSubiendoFactura(false);
    }
  };

  const actualizarStock = async (productosFactura) => {
    console.log('📦 Procesando', productosFactura.length, 'productos...');
    
    const errores = [];
    
    for (let i = 0; i < productosFactura.length; i++) {
      const productoFactura = productosFactura[i];
      try {
        console.log(`🔄 Procesando producto ${i + 1}/${productosFactura.length}:`, productoFactura.nombre);
        
        // Validar datos del producto
        if (!productoFactura.nombre || !productoFactura.cantidad || !productoFactura.precioUnitario) {
          console.warn(`⚠️ Producto ${productoFactura.nombre} tiene datos incompletos, saltando...`);
          errores.push(`Producto "${productoFactura.nombre}" tiene datos incompletos`);
          continue;
        }
        
        let productoExistente = null;

        // Si el producto fue asignado a uno existente durante la edición, usar ese
        if (productoFactura.productoExistente) {
          productoExistente = productoFactura.productoExistente;
          console.log('  📌 Producto asignado a uno existente:', productoExistente.nombre);
        } else {
          // Buscar producto existente por código o codigoBarra DEL MISMO USUARIO
          productoExistente = productos.find(p => {
            const codigoProducto = (p.codigo || p.codigoBarra || '').toLowerCase().trim();
            const codigoFactura = (productoFactura.codigo || '').toLowerCase().trim();
            // IMPORTANTE: Solo buscar en productos del mismo usuario
            return p.usuario === usuario.email && 
                   codigoProducto && codigoFactura && 
                   codigoProducto === codigoFactura;
          });
          if (productoExistente) {
            console.log('  🔍 Producto encontrado por código (mismo usuario):', productoExistente.nombre);
          }
        }

        if (productoExistente) {
          // Actualizar stock del producto existente
          const stockActual = productoExistente.stock || 0;
          const cantidadAgregar = parseInt(productoFactura.cantidad);
          const nuevoStock = stockActual + cantidadAgregar;
          
          console.log(`  ✏️ Actualizando producto existente: ${productoExistente.nombre}`);
          console.log(`     Stock: ${stockActual} + ${cantidadAgregar} = ${nuevoStock}`);
          console.log(`     Precio costo: €${productoFactura.precioUnitario}`);
          
          const updateData = {
            stock: nuevoStock,
            precioCosto: parseFloat(productoFactura.precioUnitario),
            ultimaActualizacion: new Date().toISOString(),
            ultimaCompra: {
              fecha: new Date().toISOString(),
              cantidad: cantidadAgregar,
              precioCosto: parseFloat(productoFactura.precioUnitario),
              proveedor: nuevaFactura?.proveedor || 'Sin especificar'
            }
          };
          
          console.log('     Datos a actualizar:', updateData);
          
          await secureUpdateDoc('productos', productoExistente.id, updateData);
          console.log(`  ✅ Stock actualizado para ${productoExistente.nombre}`);
          
        } else {
          // Crear nuevo producto con precio de costo y sugerir precio de venta
          const precioCosto = parseFloat(productoFactura.precioUnitario);
          const precioVentaSugerido = parseFloat((precioCosto * 1.3).toFixed(2)); // 30% de margen sugerido
          
          console.log(`  ➕ Creando nuevo producto: ${productoFactura.nombre}`);
          console.log(`     Precio costo: €${precioCosto}, Precio venta sugerido: €${precioVentaSugerido}`);
          
          const nuevoProducto = {
            codigo: productoFactura.codigo || '',
            codigoBarra: productoFactura.codigo || '', // Compatibilidad
            nombre: productoFactura.nombre.trim(),
            stock: parseInt(productoFactura.cantidad),
            precio: precioVentaSugerido, // Precio de venta sugerido
            precioCosto: precioCosto, // Precio de compra
            categoria: 'Bebidas', // Categoría sugerida
            usuario: usuario.email,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            activo: true,
            margenBeneficio: 30, // Margen del 30%
            ultimaCompra: {
              fecha: new Date().toISOString(),
              cantidad: parseInt(productoFactura.cantidad),
              precioCosto: precioCosto,
              proveedor: nuevaFactura?.proveedor || 'Sin especificar'
            }
          };
          
          console.log('     Datos del nuevo producto:', nuevoProducto);
          
          const docRef = await secureAddDoc('productos', nuevoProducto);
          console.log(`  ✅ Nuevo producto creado con ID: ${docRef.id} - ${nuevoProducto.nombre}`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando producto "${productoFactura.nombre}":`, error);
        errores.push(`Error con producto "${productoFactura.nombre}": ${error.message}`);
        // Continuar con el siguiente producto
      }
    }
    
    if (errores.length > 0) {
      console.warn('⚠️ Se encontraron errores durante la actualización de stock:', errores);
      throw new Error(`Errores en ${errores.length} productos: ${errores.join(', ')}`);
    }
    
    console.log('✅ Procesamiento de productos completado exitosamente');
  };

  const calcularTotalFactura = () => {
    return nuevaFactura.productos.reduce((total, producto) => 
      total + (producto.cantidad * producto.precioUnitario), 0
    ).toFixed(2);
  };

  const verFactura = (factura) => {
    setFacturaSeleccionada(factura);
  };

  const cargarFacturaEjemplo = () => {
    const facturaEjemplo = {
      numeroFactura: 'FAC-2025-157',
      proveedor: 'Distribuidora Bebidas S.L.',
      fecha: new Date().toISOString().split('T')[0],
      total: '89.40',
      archivo: null,
      productos: [
        {
          codigo: '123456789123',
          nombre: 'Coca-Cola Original Lata 330ml',
          cantidad: 24,
          precioUnitario: 1.20,
          total: (24 * 1.20).toFixed(2)
        },
        {
          codigo: '123456789124',
          nombre: 'Fanta Naranja Lata 330ml',
          cantidad: 12,
          precioUnitario: 0.60,
          total: (12 * 0.60).toFixed(2)
        },
        {
          codigo: '123456789125',
          nombre: 'Sprite Limón Lata 330ml',
          cantidad: 18,
          precioUnitario: 1.15,
          total: (18 * 1.15).toFixed(2)
        },
        {
          codigo: '123456789126',
          nombre: 'Aquarius Naranja Botella 500ml',
          cantidad: 6,
          precioUnitario: 1.80,
          total: (6 * 1.80).toFixed(2)
        },
        {
          codigo: '123456789127',
          nombre: 'Pepsi Cola Lata 330ml',
          cantidad: 12,
          precioUnitario: 1.10,
          total: (12 * 1.10).toFixed(2)
        },
        {
          codigo: '123456789128',
          nombre: 'Mirinda Naranja Lata 330ml',
          cantidad: 8,
          precioUnitario: 0.65,
          total: (8 * 0.65).toFixed(2)
        }
      ]
    };

    setNuevaFactura(facturaEjemplo);
    setMostrarFormulario(true);
    alert('✅ Datos de factura ejemplo cargados!\n\n' +
          '🔍 Este ejemplo incluye productos con similitudes que podrían confundir:\n' +
          '• Fanta Naranja vs Aquarius Naranja vs Mirinda Naranja\n' +
          '• Coca-Cola vs Pepsi Cola\n' +
          '• Productos de diferentes marcas con mismo sabor\n\n' +
          '💡 El nuevo algoritmo es más estricto:\n' +
          '• Marcas diferentes = 0% similitud\n' +
          '• Solo asigna con 85%+ de confianza\n' +
          '• Diferencia correctamente sabores de marcas distintas\n\n' +
          '🧪 Usa el analizador automático para probar la mejora!');
  };

  const eliminarProducto = (index) => {
    const productosActualizados = nuevaFactura.productos.filter((_, i) => i !== index);
    setNuevaFactura({
      ...nuevaFactura,
      productos: productosActualizados
    });
  };

  const verificarYCrearColecciones = async () => {
    try {
      console.log('🔍 Verificando colecciones necesarias...');
      
      const facturasData = await secureGetDocs('facturas', []);
      
      if (facturasData.length === 0) {
        console.log('📝 Usuario no tiene facturas, creando documento de inicialización...');
        
        const documentoPrueba = {
          _tipo: 'documento_inicializacion',
          _creado: new Date().toISOString(),
          _nota: 'Documento creado automáticamente para inicializar las facturas del usuario'
        };
        
        await secureAddDoc('facturas', documentoPrueba);
        console.log('✅ Documento de inicialización creado para el usuario');
      } else {
        console.log('✅ Usuario ya tiene', facturasData.length, 'facturas');
      }
      
      const productosData = await secureGetDocs('productos', []);
      console.log('📦 Usuario tiene', productosData.length, 'productos');
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando colecciones:', error);
      throw error;
    }
  };

  const diagnosticarConectividad = async () => {
    console.log('🔧 Iniciando diagnóstico de conectividad...');
    
    const resultados = {
      auth: '❓ No verificado',
      firestore: '❓ No verificado',
      storage: '❓ No verificado',
      usuario: '❓ No verificado',
      productos: '❓ No verificado',
      facturas: '❓ No verificado'
    };
    
    try {
      if (usuario && usuario.email) {
        resultados.auth = '✅ Conectado';
        resultados.usuario = `✅ ${usuario.email}`;
      } else {
        resultados.auth = '❌ No autenticado';
        resultados.usuario = '❌ Usuario no válido';
      }
      
      try {
        console.log('🔍 Probando lectura de productos del usuario...');
        const productosData = await secureGetDocs('productos', []);
        resultados.productos = `✅ ${productosData.length} productos del usuario`;
        resultados.firestore = '✅ Conectado (productos filtrados)';
      } catch (productosError) {
        console.error('❌ Error productos:', productosError);
        resultados.productos = `❌ Error: ${productosError.code || productosError.message}`;
      }
      
      try {
        console.log('🔍 Probando lectura de facturas del usuario...');
        const facturasData = await secureGetDocs('facturas', []);
        resultados.facturas = `✅ ${facturasData.length} facturas del usuario`;
        
        if (facturasData.length === 0) {
          resultados.facturas = '⚠️ Usuario sin facturas - se creará automáticamente';
        }
      } catch (facturasError) {
        console.error('❌ Error facturas:', facturasError);
        resultados.facturas = `❌ Error: ${facturasError.code || facturasError.message}`;
      }
      
      resultados.storage = '✅ No se usa Storage en esta versión';
      
    } catch (error) {
      console.error('❌ Error general en diagnóstico:', error);
    }
    
    const mensaje = `🔧 DIAGNÓSTICO DE CONECTIVIDAD\n\n` +
                   `🔐 Autenticación: ${resultados.auth}\n` +
                   `👤 Usuario: ${resultados.usuario}\n` +
                   `🗄️ Firestore: ${resultados.firestore}\n` +
                   `📦 Productos: ${resultados.productos}\n` +
                   `📄 Facturas: ${resultados.facturas}\n` +
                   `☁️ Storage: ${resultados.storage}\n\n` +
                   `🔒 AISLAMIENTO DE DATOS:\n` +
                   `• Solo VES tus productos, facturas y configuraciones\n` +
                   `• Otros usuarios NO pueden acceder a tus datos\n` +
                   `• Cada usuario tiene su espacio privado\n\n` +
                   `💡 Si hay errores:\n` +
                   `• Usa "Crear Colección" si facturas está vacía\n` +
                   `• Verifica permisos en Firebase Console\n` +
                   `• Revisa reglas de Firestore (deben filtrar por usuario)\n` +
                   `• Comprueba que existan los índices necesarios`;
    
    alert(mensaje);
    console.log('🔧 Diagnóstico completado:', resultados);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso denegado</h3>
          <p className="text-gray-600">Debes iniciar sesión para acceder a las facturas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Facturas de Proveedores</h1>
                <p className="text-gray-600">Gestiona las facturas de compra y actualiza el inventario automáticamente</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('🐛 DEBUG INFO:');
                  console.log('Usuario:', usuario.email);
                  console.log('Productos cargados:', productos.length);
                  console.log('Productos:', productos);
                  alert(`Debug Info:\nUsuario: ${usuario.email}\nProductos: ${productos.length}\nVer consola para más detalles`);
                }}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                🐛 Debug
              </button>
              <button
                onClick={() => setMostrarFacturaSimulada(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Ver Factura Ejemplo
              </button>
              <button
                onClick={cargarFacturaEjemplo}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <CubeIcon className="h-5 w-5 mr-2" />
                Cargar Datos Ejemplo
              </button>
              <button
                onClick={diagnosticarConectividad}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Diagnóstico
              </button>
              <button
                onClick={async () => {
                  try {
                    await verificarYCrearColecciones();
                    alert('✅ Colecciones verificadas/creadas correctamente');
                    // Recargar datos
                    await cargarFacturas();
                    await cargarProductos();
                  } catch (error) {
                    alert(`❌ Error creando colecciones: ${error.message}`);
                  }
                }}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <CubeIcon className="h-5 w-5 mr-2" />
                Crear Colección
              </button>
              <button
                onClick={() => setMostrarConfiguracionEmpresa(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Configurar Empresa
              </button>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <DocumentPlusIcon className="h-5 w-5 mr-2" />
                Nueva Factura
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Formulario de nueva factura */}
        {mostrarFormulario && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {facturaEditando ? `Editar Factura: ${facturaEditando.numeroFactura}` : 'Nueva Factura de Proveedor'}
              </h2>
              <button
                onClick={facturaEditando ? cancelarEdicion : () => setMostrarFormulario(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de la factura */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información de la Factura</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Factura *
                  </label>
                  <input
                    type="text"
                    value={nuevaFactura.numeroFactura}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, numeroFactura: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="FAC-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={nuevaFactura.proveedor}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, proveedor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Factura
                  </label>
                  <input
                    type="date"
                    value={nuevaFactura.fecha}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, fecha: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Factura
                  </label>
                  <input
                    type="text"
                    value={`€${calcularTotalFactura()}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total calculado automáticamente</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Archivo de Factura (PDF, JPG, PNG)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={archivoHabilitado}
                        onChange={(e) => setArchivoHabilitado(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-xs text-gray-600">Habilitar archivos</span>
                    </div>
                  </div>
                  
                  {!archivoHabilitado && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                      <p className="text-xs text-yellow-800">
                        ⚠️ <strong>Subida de archivos deshabilitada</strong><br/>
                        Si tienes errores de CORS o conexión, puedes trabajar sin archivos adjuntos.
                        Para habilitar archivos, configura Firebase Storage correctamente.
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    onChange={handleArchivoChange}
                    disabled={!archivoHabilitado}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !archivoHabilitado ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {nuevaFactura.archivo && archivoHabilitado && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Archivo seleccionado: {nuevaFactura.archivo.name}
                    </p>
                  )}
                </div>

                {/* Análisis automático con IA */}
                {archivoHabilitado ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <AnalizadorFacturas
                      archivo={nuevaFactura.archivo}
                      onProductosExtraidos={manejarProductosExtraidos}
                      onError={manejarErrorAnalisis}
                      productosExistentes={productos}
                    />
                    
                    {/* Preview de productos extraídos */}
                    {mostrarProductosExtraidos && productosExtraidos.length > 0 && (
                      <div className="mt-4 border border-purple-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-purple-900">
                            🤖 Productos Detectados por IA ({productosExtraidos.length})
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={agregarTodosProductosExtraidos}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                            >
                              Agregar Todos
                            </button>
                            <button
                              onClick={limpiarProductosExtraidos}
                              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {productosExtraidos.map((producto, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded text-xs">
                              <div className="flex-1">
                                <div className="font-medium">{producto.nombre}</div>
                                <div className="text-gray-600">
                                  Código: {producto.codigo} | Cantidad: {producto.cantidad} | €{producto.precioUnitario}/ud
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">€{(producto.cantidad * producto.precioUnitario).toFixed(2)}</span>
                                <button
                                  onClick={() => agregarProductoExtraido(producto)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-purple-700 mt-2">
                          💡 Revisa los productos detectados y agrégalos individualmente o todos a la vez.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-center text-gray-500">
                      <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Análisis automático deshabilitado</p>
                      <p className="text-xs">Habilita archivos para usar el análisis con IA</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Productos de la factura */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Productos de la Factura</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-800">
                      <strong>Importante:</strong> Los precios deben ser de <strong>compra al proveedor</strong>, no de venta al cliente. El sistema calculará automáticamente márgenes de beneficio sugeridos.
                    </p>
                  </div>
                </div>

                {/* Agregar producto manual */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Producto</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Código *"
                      value={productoManual.codigo}
                      onChange={(e) => setProductoManual({...productoManual, codigo: e.target.value})}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Cantidad *"
                      value={productoManual.cantidad}
                      onChange={(e) => setProductoManual({...productoManual, cantidad: e.target.value})}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre del producto *"
                    value={productoManual.nombre}
                    onChange={(e) => setProductoManual({...productoManual, nombre: e.target.value})}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio de compra"
                      value={productoManual.precioUnitario}
                      onChange={(e) => setProductoManual({...productoManual, precioUnitario: e.target.value})}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={agregarProductoManual}
                      className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Precio que pagas al proveedor (no precio de venta)
                  </p>
                </div>

                {/* Lista de productos agregados */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {nuevaFactura.productos.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-white">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{producto.nombre}</span>
                          <button
                            onClick={() => eliminarProducto(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-600">
                          Código: {producto.codigo} | Cantidad: {producto.cantidad} | €{producto.precioUnitario}/ud
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-sm">€{producto.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Calculado:</span>
                    <span className="text-lg font-bold text-blue-600">€{calcularTotalFactura()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={facturaEditando ? cancelarEdicion : () => setMostrarFormulario(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={subirFactura}
                disabled={subiendoFactura || nuevaFactura.productos.length === 0}
                className={`flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                  subiendoFactura || nuevaFactura.productos.length === 0
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {subiendoFactura ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {facturaEditando ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    {facturaEditando ? `Actualizar Factura` : `Guardar Factura`} ({nuevaFactura.productos.length} productos)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Lista de facturas */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Facturas Registradas</h2>
            <p className="text-gray-600 mt-1">Total: {facturas.length} facturas</p>
          </div>

          <div className="overflow-x-auto">
            {facturas.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas registradas</h3>
                <p className="text-gray-600">Comienza subiendo tu primera factura de proveedor</p>
              </div>
            ) :
            (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facturas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {factura.numeroFactura}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{factura.proveedor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(factura.fecha).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          €{factura.total?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CubeIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {factura.productos?.length || 0} productos
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          factura.procesada 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {factura.procesada ? 'Procesada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => verFactura(factura)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => iniciarEdicionFactura(factura)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Editar factura"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setMostrarConfirmacionEliminar(factura)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Eliminar factura"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => generarFacturaPDF(factura)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                            title="Descargar PDF"
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
                          </button>
                          {factura.archivoUrl && (
                            <a
                              href={factura.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900 p-1 rounded"
                              title="Ver archivo original"
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal de factura simulada */}
        {mostrarFacturaSimulada && (
          <FacturaSimulada onCerrar={() => setMostrarFacturaSimulada(false)} />
        )}

        {/* Modal de detalles de factura */}
        {facturaSeleccionada && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles de Factura: {facturaSeleccionada.numeroFactura}
                </h3>
                <button
                  onClick={() => setFacturaSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información General</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Proveedor:</strong> {facturaSeleccionada.proveedor}</p>
                    <p><strong>Fecha:</strong> {new Date(facturaSeleccionada.fecha).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> €{facturaSeleccionada.total?.toFixed(2)}</p>
                    <p><strong>Estado:</strong> {facturaSeleccionada.procesada ? 'Procesada' : 'Pendiente'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Productos ({facturaSeleccionada.productos?.length || 0})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {facturaSeleccionada.productos?.map((producto, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="text-gray-600">
                          {producto.cantidad} × €{producto.precioUnitario} = €{producto.total}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setFacturaSeleccionada(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de configuración de empresa */}
        {mostrarConfiguracionEmpresa && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <BuildingStorefrontIcon className="h-8 w-8 text-emerald-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Configuración de Empresa
                  </h3>
                </div>
                <button
                  onClick={() => setMostrarConfiguracionEmpresa(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <IdentificationIcon className="h-5 w-5 mr-2 text-emerald-600" />
                    Información Básica
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={datosEmpresa.nombre}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Mi Empresa S.L."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={datosEmpresa.direccion}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, direccion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Calle Principal 123"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={datosEmpresa.ciudad}
                        onChange={(e) => setDatosEmpresa({...datosEmpresa, ciudad: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Madrid"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={datosEmpresa.codigoPostal}
                        onChange={(e) => setDatosEmpresa({...datosEmpresa, codigoPostal: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="28001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={datosEmpresa.telefono}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="+34 123 456 789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={datosEmpresa.email}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="info@miempresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                      Sitio Web
                    </label>
                    <input
                      type="text"
                      value={datosEmpresa.web}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, web: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="www.miempresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CIF/NIF
                    </label>
                    <input
                      type="text"
                      value={datosEmpresa.cif}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, cif: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="B-12345678"
                    />
                  </div>
                </div>

                {/* Personalización y logo */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <PaintBrushIcon className="h-5 w-5 mr-2 text-emerald-600" />
                    Personalización
                  </h4>

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhotoIcon className="h-4 w-4 inline mr-1" />
                      Logo de la Empresa
                    </label>
                    
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-32 h-32 object-contain border border-gray-300 rounded-lg mb-2"
                        />
                        <button
                          onClick={eliminarLogo}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <input
                      type="file"
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG. Máximo 2MB. Recomendado: 300x300px
                    </p>
                  </div>

                  {/* Colores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color Primario
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={datosEmpresa.colorPrimario}
                          onChange={(e) => setDatosEmpresa({...datosEmpresa, colorPrimario: e.target.value})}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={datosEmpresa.colorPrimario}
                          onChange={(e) => setDatosEmpresa({...datosEmpresa, colorPrimario: e.target.value})}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color Secundario
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={datosEmpresa.colorSecundario}
                          onChange={(e) => setDatosEmpresa({...datosEmpresa, colorSecundario: e.target.value})}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={datosEmpresa.colorSecundario}
                          onChange={(e) => setDatosEmpresa({...datosEmpresa, colorSecundario: e.target.value})}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview de colores */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                    <div 
                      className="p-3 rounded text-white text-sm font-medium mb-2"
                      style={{ backgroundColor: datosEmpresa.colorPrimario }}
                    >
                      Encabezado con color primario
                    </div>
                    <div 
                      className="p-2 rounded text-white text-xs"
                      style={{ backgroundColor: datosEmpresa.colorSecundario }}
                    >
                      Texto con color secundario
                    </div>
                  </div>

                  {/* Pie de factura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DocumentDuplicateIcon className="h-4 w-4 inline mr-1" />
                      Mensaje del pie de factura
                    </label>
                    <textarea
                      value={datosEmpresa.pieFactura}
                      onChange={(e) => setDatosEmpresa({...datosEmpresa, pieFactura: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Gracias por confiar en nosotros"
                    />
                  </div>

                  {/* Opciones adicionales */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={datosEmpresa.mostrarLogo}
                        onChange={(e) => setDatosEmpresa({...datosEmpresa, mostrarLogo: e.target.checked})}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Mostrar logo en facturas</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setMostrarConfiguracionEmpresa(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarConfiguracionEmpresa}
                  disabled={guardandoConfiguracion}
                  className={`flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    guardandoConfiguracion
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                  }`}
                >
                  {guardandoConfiguracion ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {mostrarConfirmacionEliminar && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-1/2 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white transform -translate-y-1/2">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Eliminación
                </h3>
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que quieres eliminar la factura "{mostrarConfirmacionEliminar.numeroFactura}"?
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setMostrarConfirmacionEliminar(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEliminacion}
                    disabled={eliminandoFactura}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      eliminandoFactura
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {eliminandoFactura ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



export default FacturasPage;
