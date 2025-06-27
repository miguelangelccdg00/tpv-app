import { useState } from 'react';
import { 
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import EditorProductosExtraidos from './EditorProductosExtraidos_nuevo';

const AnalizadorFacturas = ({ archivo, onProductosExtraidos, onError, productosExistentes }) => {
  const [analizando, setAnalizando] = useState(false);
  const [resultadoAnalisis, setResultadoAnalisis] = useState(null);
  const [mostrarEditor, setMostrarEditor] = useState(false);

  // Función simulada de análisis OCR
  const analizarFacturaOCR = async (archivo) => {
    // En un entorno real, aquí se integraría con un servicio OCR como:
    // - Google Cloud Vision API
    // - Azure Computer Vision
    // - AWS Textract
    // - Tesseract.js (OCR en el navegador)
    
    setAnalizando(true);
    
    try {
      // Simular el procesamiento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Datos simulados extraídos de la factura con productos reales y precios de compra
      const datosExtraidos = {
        numeroFactura: 'FAC-2025-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        proveedor: ['Coca-Cola Iberian Partners', 'Distribuidora de Bebidas S.L.', 'Refrescos del Sur'][Math.floor(Math.random() * 3)],
        fecha: new Date().toISOString().split('T')[0],
        productos: [
          {
            codigo: '123456789123',
            nombre: 'Coca-Cola',
            cantidad: 24,
            precioUnitario: 1.20, // Precio de compra (se vende a €1.50)
            total: (24 * 1.20).toFixed(2)
          },
          {
            codigo: '123456789124', 
            nombre: 'Fanta Naranja',
            cantidad: 12,
            precioUnitario: 0.60, // Precio de compra (se vende a €0.78)
            total: (12 * 0.60).toFixed(2)
          },
          {
            codigo: '123456789125',
            nombre: 'Sprite Limón',
            cantidad: 18,
            precioUnitario: 1.15, // Precio de compra (se vende a €1.45)
            total: (18 * 1.15).toFixed(2)
          },
          {
            codigo: '123456789126',
            nombre: 'Aquarius Naranja',
            cantidad: 6,
            precioUnitario: 1.80, // Precio de compra (se vende a €2.20)
            total: (6 * 1.80).toFixed(2)
          }
        ],
        confianza: 0.95 // Nivel de confianza del análisis (95%)
      };
      
      setResultadoAnalisis(datosExtraidos);
      
      if (onProductosExtraidos) {
        onProductosExtraidos(datosExtraidos);
      }
      
    } catch (error) {
      console.error('Error en análisis OCR:', error);
      if (onError) {
        onError('Error al analizar la factura: ' + error.message);
      }
    } finally {
      setAnalizando(false);
    }
  };

  const iniciarAnalisis = () => {
    if (!archivo) {
      if (onError) {
        onError('No hay archivo seleccionado para analizar');
      }
      return;
    }
    
    analizarFacturaOCR(archivo);
  };

  const aplicarResultados = () => {
    if (resultadoAnalisis && onProductosExtraidos) {
      onProductosExtraidos(resultadoAnalisis);
      setResultadoAnalisis(null);
    }
  };

  const abrirEditor = () => {
    setMostrarEditor(true);
  };

  const manejarProductosEditados = (productosEditados) => {
    // Construir el resultado final con los productos editados
    const resultadoFinal = {
      ...resultadoAnalisis,
      productos: productosEditados
    };
    
    if (onProductosExtraidos) {
      onProductosExtraidos(resultadoFinal);
    }
    
    setResultadoAnalisis(null);
    setMostrarEditor(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
      <div className="flex items-center mb-3">
        <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
        <h4 className="text-sm font-medium text-purple-900">Análisis Automático con IA</h4>
      </div>
      
      <p className="text-xs text-purple-700 mb-4">
        Extrae automáticamente los productos y cantidades de la factura usando tecnología OCR
      </p>
      
      {!analizando && !resultadoAnalisis && (
        <button
          onClick={iniciarAnalisis}
          disabled={!archivo}
          className={`w-full flex items-center justify-center px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 ${
            archivo
              ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <SparklesIcon className="h-4 w-4 mr-2" />
          Analizar Factura con IA
        </button>
      )}
      
      {analizando && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-purple-700">Analizando factura...</p>
          <p className="text-xs text-purple-600">Extrayendo productos y cantidades</p>
        </div>
      )}
      
      {resultadoAnalisis && (
        <div className="space-y-3">
          <div className="flex items-center text-green-700">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              Análisis completado ({Math.round(resultadoAnalisis.confianza * 100)}% confianza)
            </span>
          </div>
          
          <div className="bg-white rounded p-3 text-xs">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <span className="text-gray-600">Factura:</span>
                <p className="font-medium">{resultadoAnalisis.numeroFactura}</p>
              </div>
              <div>
                <span className="text-gray-600">Proveedor:</span>
                <p className="font-medium">{resultadoAnalisis.proveedor}</p>
              </div>
            </div>
            
            <div className="border-t pt-2">
              <span className="text-gray-600">Productos encontrados:</span>
              <div className="mt-1 space-y-1">
                {resultadoAnalisis.productos.map((producto, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-gray-600">{producto.codigo} - {producto.cantidad} uds</p>
                    </div>
                    <span className="font-medium">€{producto.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={abrirEditor}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar y Asignar Productos
            </button>
            <button
              onClick={aplicarResultados}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Usar Sin Editar
            </button>
            <button
              onClick={() => setResultadoAnalisis(null)}
              className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <div className="flex">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium">Recomendación:</p>
                <p>Usa <strong>"Editar y Asignar Productos"</strong> para revisar los datos extraídos, corregir errores del OCR y asignar productos a los existentes en tu inventario.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor de productos extraídos */}
      <EditorProductosExtraidos
        productosExtraidos={resultadoAnalisis?.productos || []}
        productosExistentes={productosExistentes || []}
        onProductosEditados={manejarProductosEditados}
        onCerrar={() => setMostrarEditor(false)}
        mostrar={mostrarEditor}
      />
    </div>
  );
};

export default AnalizadorFacturas;
