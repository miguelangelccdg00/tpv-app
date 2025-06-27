import { useState, useEffect, useCallback } from 'react';
import { 
  PrinterIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  BuildingStorefrontIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useSecureData } from '../../../contexts/SecureDataContext';
import { useAuth } from '../../../AuthContext';

const ConfiguracionPage = () => {
  const { usuario } = useAuth();
  const { secureGetDocs, secureAddDoc, secureUpdateDoc } = useSecureData();
  
  // Configuración por defecto
  const configuracionDefault = {
    impresoraHabilitada: true,
    impresoraSeleccionada: '',
    anchoTicket: 280,
    cortarPapel: true,
    nombreTienda: 'TPV Sistema',
    logoTienda: '',
    direccionTienda: '',
    telefonoTienda: '',
    nombreCajero: 'Cajero',
    mensajePie: '¡Gracias por su compra!\nConserve este ticket como\ncomprobante de su compra.',
    copiesTicket: 1
  };

  const [configuracion, setConfiguracion] = useState(configuracionDefault);
  const [impresorasDisponibles, setImpresorasDisponibles] = useState([]);
  const [testTicket, setTestTicket] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar configuración desde Firebase
  const cargarConfiguracionFirebase = async () => {
    if (!usuario?.email) {
      console.log('No hay usuario logueado');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      console.log('Cargando configuración desde Firebase para usuario:', usuario.email);
      
      // Usar secureGetDocs para obtener la configuración del usuario
      const configuraciones = await secureGetDocs('configuraciones', []);
      
      if (configuraciones.length > 0) {
        const configFirebase = configuraciones[0];
        console.log('Configuración cargada desde Firebase:', configFirebase);
        
        // Mezclar con valores por defecto para asegurar que todas las propiedades existen
        const configCompleta = {
          ...configuracionDefault,
          ...configFirebase,
          fechaActualizacion: configFirebase.fechaActualizacion || new Date().toISOString()
        };
        
        setConfiguracion(configCompleta);
        console.log('✅ Configuración cargada exitosamente desde Firebase');
      } else {
        console.log('No existe configuración en Firebase, usando valores por defecto');
        // Crear configuración inicial en Firebase
        await guardarConfiguracionFirebase(configuracionDefault, false);
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración desde Firebase:', error);
      alert('⚠️ Error al cargar la configuración desde la base de datos.\nSe usarán los valores por defecto.\n\nError: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Guardar configuración en Firebase
  const guardarConfiguracionFirebase = async (configParaGuardar = null, mostrarAlerta = true) => {
    if (!usuario?.email) {
      alert('❌ Error: No hay usuario logueado para guardar la configuración');
      return false;
    }

    try {
      setGuardando(true);
      const configAGuardar = configParaGuardar || configuracion;
      
      const configConMetadata = {
        ...configAGuardar,
        fechaActualizacion: new Date().toISOString(),
        usuario: usuario.email
      };

      console.log('Guardando configuración en Firebase:', configConMetadata);
      
      // Verificar si ya existe una configuración
      const configuracionesExistentes = await secureGetDocs('configuraciones', []);
      
      if (configuracionesExistentes.length > 0) {
        // Actualizar configuración existente
        await secureUpdateDoc('configuraciones', configuracionesExistentes[0].id, configConMetadata);
      } else {
        // Crear nueva configuración
        await secureAddDoc('configuraciones', configConMetadata);
      }
      
      console.log('✅ Configuración guardada exitosamente en Firebase');
      
      if (mostrarAlerta) {
        alert('✅ Configuración guardada exitosamente!\n\n' +
              'La configuración se ha guardado en la base de datos y estará\n' +
              'disponible en cualquier dispositivo donde inicies sesión.\n\n' +
              'Configuración guardada:\n' +
              `• Impresora: ${configAGuardar.impresoraSeleccionada || 'No seleccionada'}\n` +
              `• Nombre tienda: ${configAGuardar.nombreTienda}\n` +
              `• Cajero: ${configAGuardar.nombreCajero || 'Sin configurar'}\n` +
              `• Logo: ${configAGuardar.logoTienda ? 'Configurado' : 'Sin logo'}\n` +
              `• Ancho ticket: ${configAGuardar.anchoTicket}px`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al guardar configuración en Firebase:', error);
      if (mostrarAlerta) {
        alert('❌ Error al guardar la configuración en la base de datos.\n\nPor favor, inténtelo de nuevo.\n\nError: ' + error.message);
      }
      return false;
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    // Cargar configuración desde Firebase cuando el componente se monta
    cargarConfiguracionFirebase();
    // Detectar impresoras disponibles
    detectarImpresoras();
  }, [usuario]);

  // Autoguardar en Firebase cuando cambie la configuración (con debounce)
  useEffect(() => {
    if (!cargando && configuracion && usuario?.email) {
      // Usar un timeout para evitar guardar demasiado frecuentemente
      const timeoutId = setTimeout(() => {
        console.log('Autoguardando configuración en Firebase...');
        guardarConfiguracionFirebase(configuracion, false);
      }, 2000); // Esperar 2 segundos después del último cambio

      return () => clearTimeout(timeoutId);
    }
  }, [configuracion, cargando, usuario]);

  const detectarImpresoras = async () => {
    try {
      // Simular detección de impresoras (en un entorno real se conectaría a APIs del sistema)
      setImpresorasDisponibles([
        { id: 'default', name: 'Impresora predeterminada del sistema' },
        { id: 'termica-usb', name: 'Impresora térmica USB' },
        { id: 'termica-ethernet', name: 'Impresora térmica Ethernet' },
        { id: 'laser-hp', name: 'HP LaserJet Pro' },
        { id: 'epson-tm', name: 'Epson TM-T20III' }
      ]);
    } catch (error) {
      console.error('Error detectando impresoras:', error);
      setImpresorasDisponibles([
        { id: 'default', name: 'Impresora predeterminada del sistema' }
      ]);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('❌ Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, etc.)');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('❌ El archivo es demasiado grande. Máximo 2MB permitido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setConfiguracion({
          ...configuracion,
          logoTienda: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarConfiguracion = async () => {
    if (!usuario?.email) {
      alert('❌ Error: No hay usuario logueado para guardar la configuración');
      return;
    }

    try {
      setGuardando(true);
      await guardarConfiguracionFirebase(configuracion, true);
    } catch (error) {
      console.error('Error en guardarConfiguracion:', error);
      alert('❌ Error al guardar la configuración: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const generarVistaPrevia = () => {
    const fecha = new Date();
    const fechaFormateada = fecha.toLocaleDateString('es-ES');
    const horaFormateada = fecha.toLocaleTimeString('es-ES');
    
    const logoHTML = configuracion.logoTienda ? `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${configuracion.logoTienda}" alt="Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;"/>
      </div>
    ` : '';

    return `
      <div style="width: ${configuracion.anchoTicket}px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; text-align: center; border: 1px solid #ccc; padding: 10px; background: white;">
        ${logoHTML}
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;">
          <h2 style="margin: 5px 0; font-size: 16px; font-weight: bold;">${configuracion.nombreTienda}</h2>
          ${configuracion.direccionTienda ? `<div style="font-size: 10px;">${configuracion.direccionTienda}</div>` : ''}
          ${configuracion.telefonoTienda ? `<div style="font-size: 10px;">Tel: ${configuracion.telefonoTienda}</div>` : ''}
        </div>
        
        <div style="text-align: left; margin: 10px 0;">
          <div>Fecha: ${fechaFormateada}</div>
          <div>Hora: ${horaFormateada}</div>
          <div>Ticket: #PREVIEW001</div>
          <div>Cajero: ${configuracion.nombreCajero || 'Cajero'}</div>
        </div>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="font-weight: bold; margin: 5px 0;">PRODUCTOS:</div>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        
        <div style="text-align: left; margin: 3px 0;">
          <div style="font-weight: bold;">Producto de Prueba</div>
          <div style="display: flex; justify-content: space-between;">
            <span>2 x €5.50</span>
            <span style="font-weight: bold;">€11.00</span>
          </div>
        </div>
        
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>
        
        <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
          TOTAL A PAGAR: €11.00
        </div>
        
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>
        
        <div style="margin: 15px 0; white-space: pre-line;">
          ${configuracion.mensajePie}
        </div>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="font-size: 10px; margin: 5px 0;">
          TPV Sistema v1.0
        </div>
      </div>
    `;
  };

  const imprimirPrueba = () => {
    const ticketHTML = generarVistaPrevia();
    
    const ventanaImpresion = window.open('', '_blank', `width=${configuracion.anchoTicket + 50},height=700`);
    
    if (!ventanaImpresion) {
      alert('⚠️ No se pudo abrir la ventana de impresión.\nVerifique que no esté bloqueada por el navegador.');
      return;
    }
    
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Ticket de Prueba</title>
          <style>
            body { margin: 0; padding: 10px; background: white; }
            @media print {
              body { margin: 0; padding: 5px; }
              @page { margin: 0; size: ${configuracion.anchoTicket}px auto; }
            }
            .no-print { display: block; text-align: center; margin: 10px 0; padding: 10px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <p><strong>🖨️ Ticket de Prueba</strong></p>
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">🖨️ Imprimir</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">❌ Cerrar</button>
          </div>
          ${ticketHTML}
        </body>
      </html>
    `);
    
    ventanaImpresion.document.close();
    setTimeout(() => ventanaImpresion.print(), 1000);
  };

  const probarPersistencia = async () => {
    if (!usuario?.email) {
      alert('❌ Error: No hay usuario logueado para verificar la persistencia');
      return;
    }

    try {
      setGuardando(true);
      console.log('Probando persistencia: leyendo configuración desde Firebase...');
      
      const configuraciones = await secureGetDocs('configuraciones', []);
      
      if (configuraciones.length > 0) {
        const config = configuraciones[0];
        alert('✅ Test de Persistencia Exitoso!\n\n' +
              'Los datos están correctamente guardados en Firebase (nube):\n\n' +
              `• Nombre tienda: ${config.nombreTienda || 'No configurado'}\n` +
              `• Impresora: ${config.impresoraSeleccionada || 'No seleccionada'}\n` +
              `• Logo: ${config.logoTienda ? 'Configurado (' + config.logoTienda.substring(0, 30) + '...)' : 'Sin logo'}\n` +
              `• Ancho ticket: ${config.anchoTicket}px\n` +
              `• Dirección: ${config.direccionTienda || 'No configurada'}\n` +
              `• Teléfono: ${config.telefonoTienda || 'No configurado'}\n` +
              `• Última actualización: ${config.fechaActualizacion ? new Date(config.fechaActualizacion).toLocaleString('es-ES') : 'No disponible'}\n\n` +
              'Esta configuración estará disponible desde cualquier dispositivo\n' +
              'donde inicies sesión con tu cuenta.');
      } else {
        alert('⚠️ No hay configuración guardada en Firebase.\n\n' +
              'Guarda la configuración primero para poder probar la persistencia.');
      }
    } catch (error) {
      console.error('Error al probar persistencia:', error);
      alert('❌ Error al verificar la persistencia: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarLogo = () => {
    setConfiguracion({
      ...configuracion,
      logoTienda: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración de Impresión</h1>
              <p className="text-gray-600">Personaliza la impresión de tickets para tu TPV</p>
            </div>
          </div>
        </div>

        {/* Verificar si el usuario está logueado */}
        {!usuario ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Sesión requerida</h2>
                <p className="text-red-700">
                  Debes iniciar sesión para acceder a la configuración de impresión.
                  Tu configuración se guarda en la nube y estará disponible en todos tus dispositivos.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Información del usuario y estado de conexión */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    Configuración sincronizada para: {usuario.email}
                  </p>
                  <p className="text-xs text-blue-700">
                    Tu configuración se guarda automáticamente en Firebase y estará disponible en todos tus dispositivos
                  </p>
                </div>
              </div>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de configuración */}
          <div className="space-y-6">
            {/* Configuración de Impresora */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <PrinterIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Impresora</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Impresora
                  </label>
                  <select
                    value={configuracion.impresoraSeleccionada}
                    onChange={(e) => setConfiguracion({...configuracion, impresoraSeleccionada: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar impresora...</option>
                    {impresorasDisponibles.map((impresora) => (
                      <option key={impresora.id} value={impresora.name}>
                        {impresora.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ancho del Ticket (px)
                  </label>
                  <select
                    value={configuracion.anchoTicket}
                    onChange={(e) => setConfiguracion({...configuracion, anchoTicket: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={220}>220px (58mm)</option>
                    <option value={280}>280px (80mm)</option>
                    <option value={350}>350px (A4 estrecho)</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cortarPapel"
                    checked={configuracion.cortarPapel}
                    onChange={(e) => setConfiguracion({...configuracion, cortarPapel: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cortarPapel" className="ml-2 block text-sm text-gray-900">
                    Cortar papel automáticamente
                  </label>
                </div>
              </div>
            </div>

            {/* Información de la Tienda */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <BuildingStorefrontIcon className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Información de la Tienda</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Tienda
                  </label>
                  <input
                    type="text"
                    value={configuracion.nombreTienda}
                    onChange={(e) => setConfiguracion({...configuracion, nombreTienda: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TPV Sistema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={configuracion.direccionTienda}
                    onChange={(e) => setConfiguracion({...configuracion, direccionTienda: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Calle Principal 123, Ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={configuracion.telefonoTienda}
                    onChange={(e) => setConfiguracion({...configuracion, telefonoTienda: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+34 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cajero
                  </label>
                  <input
                    type="text"
                    value={configuracion.nombreCajero}
                    onChange={(e) => setConfiguracion({...configuracion, nombreCajero: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del cajero"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este nombre aparecerá en todos los tickets impresos
                  </p>
                </div>
              </div>
            </div>

            {/* Logo de la Tienda */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <PhotoIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Logo de la Tienda</h2>
              </div>
              
              <div className="space-y-4">
                {configuracion.logoTienda ? (
                  <div className="text-center">
                    <img 
                      src={configuracion.logoTienda} 
                      alt="Logo de la tienda" 
                      className="max-w-32 max-h-16 mx-auto object-contain border border-gray-300 rounded"
                    />
                    <div className="mt-2">
                      <button
                        onClick={eliminarLogo}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ❌ Eliminar logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No hay logo configurado</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir Logo (JPG, PNG, GIF - Máx. 2MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: 120x60px o menor para mejor visualización en el ticket
                  </p>
                </div>
              </div>
            </div>

            {/* Mensaje del Pie */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Mensaje del Pie</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje de agradecimiento
                </label>
                <textarea
                  value={configuracion.mensajePie}
                  onChange={(e) => setConfiguracion({...configuracion, mensajePie: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="¡Gracias por su compra!"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use \n para saltos de línea
                </p>
              </div>
            </div>
          </div>

          {/* Panel de vista previa */}
          <div className="space-y-6">
            {/* Vista Previa */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <EyeIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Vista Previa</h2>
                </div>
                <button
                  onClick={() => setVistaPrevia(!vistaPrevia)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {vistaPrevia ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {vistaPrevia && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto">
                  <div 
                    dangerouslySetInnerHTML={{ __html: generarVistaPrevia() }}
                    className="mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones</h2>
              
              <div className="space-y-3">
                {/* Estado de guardado dinámico */}
                {cargando ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-blue-800 font-medium">
                        Cargando configuración desde la nube...
                      </span>
                    </div>
                  </div>
                ) : guardando ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
                      <span className="text-sm text-yellow-800 font-medium">
                        Guardando en Firebase...
                      </span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      Sincronizando con la base de datos en la nube
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-800 font-medium">
                        Configuración sincronizada con Firebase
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Los cambios se guardan automáticamente en la nube y están disponibles en todos tus dispositivos
                    </p>
                  </div>
                )}
                
                <button
                  onClick={guardarConfiguracion}
                  disabled={guardando || cargando || !usuario?.email}
                  className={`w-full flex items-center justify-center px-4 py-3 font-medium rounded-md focus:outline-none focus:ring-2 ${
                    guardando || cargando || !usuario?.email
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando en Firebase...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Confirmar Configuración Guardada
                    </>
                  )}
                </button>

                <button
                  onClick={probarPersistencia}
                  disabled={guardando || cargando || !usuario?.email}
                  className={`w-full flex items-center justify-center px-4 py-3 font-medium rounded-md focus:outline-none focus:ring-2 ${
                    guardando || cargando || !usuario?.email
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      🔍 Probar Persistencia en Firebase
                    </>
                  )}
                </button>
                
                <button
                  onClick={imprimirPrueba}
                  disabled={!configuracion.impresoraSeleccionada}
                  className={`w-full flex items-center justify-center px-4 py-3 font-medium rounded-md focus:outline-none focus:ring-2 ${
                    configuracion.impresoraSeleccionada
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Imprimir Ticket de Prueba
                </button>
                
                {!configuracion.impresoraSeleccionada && (
                  <p className="text-sm text-yellow-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    Selecciona una impresora para hacer pruebas
                  </p>
                )}
              </div>
            </div>

            {/* Estado de la configuración */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado Actual</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Impresora:</span>
                  <span className="font-medium">
                    {configuracion.impresoraSeleccionada || 'No seleccionada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ancho ticket:</span>
                  <span className="font-medium">{configuracion.anchoTicket}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cajero:</span>
                  <span className="font-medium">
                    {configuracion.nombreCajero || 'Sin configurar'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Logo:</span>
                  <span className="font-medium">
                    {configuracion.logoTienda ? '✅ Configurado' : '❌ Sin logo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cortar papel:</span>
                  <span className="font-medium">
                    {configuracion.cortarPapel ? '✅ Activado' : '❌ Desactivado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionPage;
