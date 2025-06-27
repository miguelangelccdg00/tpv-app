import { useState, useEffect } from 'react';
import { 
  PencilIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const EditorProductosExtraidos = ({ 
  productosExtraidos, 
  productosExistentes, 
  onProductosEditados, 
  onCerrar,
  mostrar 
}) => {
  const [productosEditables, setProductosEditables] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [indiceEditando, setIndiceEditando] = useState(null);

  useEffect(() => {
    if (productosExtraidos && productosExtraidos.length > 0) {
      console.log('🔍 EditorProductosExtraidos recibió:', productosExtraidos.length, 'productos extraídos');
      console.log('📦 Productos existentes disponibles:', productosExistentes?.length || 0);
      console.log('Productos existentes:', productosExistentes?.map(p => ({ id: p.id, nombre: p.nombre, codigo: p.codigo || p.codigoBarra })));
      
      // Inicializar productos editables con sugerencias automáticas
      const productosConSugerencias = productosExtraidos.map(producto => {
        const productoSimilar = buscarProductoSimilar(producto, productosExistentes);
        
        // Si encontramos un producto similar, guardamos también el score
        if (productoSimilar) {
          const caracteristicasExtraidas = extraerCaracteristicas(producto.nombre.toLowerCase());
          const caracteristicasEncontradas = extraerCaracteristicas(productoSimilar.nombre.toLowerCase());
          const score = calcularSimilitud(caracteristicasExtraidas, caracteristicasEncontradas);
          
          productoSimilar.scoreAsignacion = score;
        }
        
        return {
          ...producto,
          productoExistente: productoSimilar,
          editado: false,
          validado: false,
          errores: []
        };
      });
      setProductosEditables(productosConSugerencias);
    }
  }, [productosExtraidos, productosExistentes]);

  // Función para buscar productos similares por nombre o código con algoritmo mejorado
  const buscarProductoSimilar = (productoExtraido, productosDB) => {
    if (!productosDB || productosDB.length === 0) {
      console.log('⚠️ No hay productos en la base de datos para buscar similitudes');
      return null;
    }

    console.log(`🔍 Buscando producto similar para: "${productoExtraido.nombre}" (código: ${productoExtraido.codigo})`);

    // 1. Buscar por código exacto primero (máxima prioridad)
    let coincidencia = productosDB.find(p => {
      const codigoProducto = (p.codigo || p.codigoBarra || '').toLowerCase().trim();
      const codigoExtraido = (productoExtraido.codigo || '').toLowerCase().trim();
      return codigoProducto && codigoExtraido && codigoProducto === codigoExtraido;
    });

    if (coincidencia) {
      console.log(`✅ Coincidencia EXACTA por código: ${coincidencia.nombre}`);
      return coincidencia;
    }

    // 2. Buscar por nombre exacto (alta prioridad)
    const nombreExtraido = productoExtraido.nombre.toLowerCase().trim();
    coincidencia = productosDB.find(p => 
      p.nombre && p.nombre.toLowerCase().trim() === nombreExtraido
    );

    if (coincidencia) {
      console.log(`✅ Coincidencia EXACTA por nombre: ${coincidencia.nombre}`);
      return coincidencia;
    }

    // 3. Análisis avanzado por similitud de nombres
    const mejorCoincidencia = encontrarMejorCoincidencia(productoExtraido, productosDB);
    
    if (mejorCoincidencia) {
      console.log(`✅ Coincidencia por similitud (${mejorCoincidencia.score}%): ${mejorCoincidencia.producto.nombre}`);
      return mejorCoincidencia.producto;
    }

    console.log('❌ No se encontró producto similar con suficiente precisión');
    return null;
  };

  // Función avanzada para encontrar la mejor coincidencia
  const encontrarMejorCoincidencia = (productoExtraido, productosDB) => {
    const nombreExtraido = productoExtraido.nombre.toLowerCase().trim();
    
    // Extraer características del producto extraído
    const caracteristicasExtraidas = extraerCaracteristicas(nombreExtraido);
    
    console.log('🔍 Características extraídas:', caracteristicasExtraidas);
    
    let mejorCoincidencia = null;
    let mejorScore = 0;
    
    productosDB.forEach(producto => {
      if (!producto.nombre) return;
      
      const nombreProducto = producto.nombre.toLowerCase().trim();
      const caracteristicasProducto = extraerCaracteristicas(nombreProducto);
      
      // Calcular score de similitud
      const score = calcularSimilitud(caracteristicasExtraidas, caracteristicasProducto);
      
      console.log(`📊 "${producto.nombre}" - Score: ${score}%`);
      
      // Solo considerar como coincidencia si el score es >= 85% (más estricto)
      if (score > mejorScore && score >= 85) {
        mejorScore = score;
        mejorCoincidencia = { producto, score };
      }
    });
    
    if (mejorCoincidencia) {
      console.log(`🎯 Mejor coincidencia encontrada: "${mejorCoincidencia.producto.nombre}" con ${mejorCoincidencia.score}% de similitud`);
    } else {
      console.log('⚠️ No se encontró ninguna coincidencia con suficiente similitud (>=85%)');
    }
    
    return mejorCoincidencia;
  };

  // Extraer características clave del nombre del producto
  const extraerCaracteristicas = (nombre) => {
    const caracteristicas = {
      marca: '',
      producto: '',
      sabor: '',
      tamaño: '',
      unidad: '',
      tipo: '',
      palabrasCompletas: nombre.split(' ').filter(p => p.length > 1),
      palabrasUnicas: new Set(nombre.toLowerCase().split(' ').filter(p => p.length > 2))
    };
    
    // Marcas conocidas (orden importa - más específicas primero)
    const marcas = [
      'coca-cola', 'coca cola', 'fanta', 'sprite', 'aquarius', 'pepsi', 'mirinda', 
      'seven up', '7up', 'nestea', 'redbull', 'red bull', 'monster', 'schweppes',
      'trina', 'kas', 'lemon', 'tropicana', 'don simon', 'granini', 'coca'
    ];
    const productos = ['cola', 'refresco', 'bebida', 'agua', 'zumo', 'jugo', 'té', 'te', 'energética', 'energy'];
    const sabores = [
      'naranja', 'limón', 'limon', 'lima', 'cereza', 'uva', 'manzana', 'piña', 'pina',
      'original', 'clásico', 'clasico', 'melocotón', 'melocoton', 'fresa', 'tropical',
      'sin azúcar', 'zero', 'light', 'diet'
    ];
    const tipos = ['lata', 'botella', 'vidrio', 'plástico', 'plastico', 'pet', 'cristal', 'pack', 'multipack'];
    const unidades = ['ml', 'cl', 'l', 'litro', 'litros'];
    
    // Buscar marca
    for (const marca of marcas) {
      if (nombre.includes(marca)) {
        caracteristicas.marca = marca;
        break;
      }
    }
    
    // Buscar tipo de producto
    for (const prod of productos) {
      if (nombre.includes(prod)) {
        caracteristicas.producto = prod;
        break;
      }
    }
    
    // Buscar sabor
    for (const sabor of sabores) {
      if (nombre.includes(sabor)) {
        caracteristicas.sabor = sabor;
        break;
      }
    }
    
    // Buscar tipo de envase
    for (const tipo of tipos) {
      if (nombre.includes(tipo)) {
        caracteristicas.tipo = tipo;
        break;
      }
    }
    
    // Extraer tamaño y unidad (ej: "330ml", "1.5l")
    const regexTamaño = /(\d+(?:\.\d+)?)\s*(ml|cl|l|litros?)/;
    const matchTamaño = nombre.match(regexTamaño);
    if (matchTamaño) {
      caracteristicas.tamaño = matchTamaño[1];
      caracteristicas.unidad = matchTamaño[2];
    }
    
    return caracteristicas;
  };

  // Calcular similitud entre dos productos basado en sus características
  const calcularSimilitud = (carac1, carac2) => {
    let puntosTotales = 0;
    let puntosObtenidos = 0;
    
    console.log('🔍 Comparando características:');
    console.log('  Producto 1:', carac1);
    console.log('  Producto 2:', carac2);
    
    // REGLA CRÍTICA: Si las marcas son diferentes y ambas están definidas, similitud = 0
    if (carac1.marca && carac2.marca && carac1.marca !== carac2.marca) {
      console.log('❌ MARCAS DIFERENTES - similitud = 0%');
      console.log(`  "${carac1.marca}" ≠ "${carac2.marca}"`);
      return 0;
    }
    
    // REGLA CRÍTICA: Si los sabores son diferentes y ambos están definidos, similitud muy baja
    if (carac1.sabor && carac2.sabor && carac1.sabor !== carac2.sabor) {
      console.log('❌ SABORES DIFERENTES - similitud muy baja');
      console.log(`  "${carac1.sabor}" ≠ "${carac2.sabor}"`);
      return 15; // Máximo 15% si tienen sabores diferentes pero definidos
    }
    
    // Marca (peso: 35% - más importante)
    puntosTotales += 35;
    if (carac1.marca && carac2.marca) {
      if (carac1.marca === carac2.marca) {
        puntosObtenidos += 35;
        console.log('✅ Marca coincide:', carac1.marca);
      }
    } else if (!carac1.marca && !carac2.marca) {
      puntosObtenidos += 10; // Puntuación muy reducida si ninguno tiene marca
      console.log('⚠️ Ninguno tiene marca detectada');
    } else {
      console.log('⚠️ Solo uno tiene marca detectada');
      // No se dan puntos si solo uno tiene marca
    }
    
    // Sabor (peso: 30% - muy importante)
    puntosTotales += 30;
    if (carac1.sabor && carac2.sabor) {
      if (carac1.sabor === carac2.sabor) {
        puntosObtenidos += 30;
        console.log('✅ Sabor coincide:', carac1.sabor);
      }
    } else if (!carac1.sabor && !carac2.sabor) {
      puntosObtenidos += 8; // Puntuación muy reducida
      console.log('⚠️ Ninguno tiene sabor detectado');
    }
    
    // Tamaño (peso: 20%)
    puntosTotales += 20;
    if (carac1.tamaño && carac2.tamaño && carac1.unidad && carac2.unidad) {
      // Normalizar unidades para comparar
      const tamaño1 = normalizarTamaño(carac1.tamaño, carac1.unidad);
      const tamaño2 = normalizarTamaño(carac2.tamaño, carac2.unidad);
      
      if (Math.abs(tamaño1 - tamaño2) <= 0.05) { // Tolerancia de 50ml
        puntosObtenidos += 20;
        console.log('✅ Tamaño coincide:', `${carac1.tamaño}${carac1.unidad}`);
      } else {
        console.log('❌ Tamaño diferente:', `${carac1.tamaño}${carac1.unidad} vs ${carac2.tamaño}${carac2.unidad}`);
      }
    } else if (!carac1.tamaño && !carac2.tamaño) {
      puntosObtenidos += 5; // Puntuación muy reducida
      console.log('⚠️ Ninguno tiene tamaño detectado');
    }
    
    // Tipo de envase (peso: 10% - reducido)
    puntosTotales += 10;
    if (carac1.tipo && carac2.tipo) {
      if (carac1.tipo === carac2.tipo) {
        puntosObtenidos += 10;
        console.log('✅ Tipo de envase coincide:', carac1.tipo);
      }
    } else if (!carac1.tipo && !carac2.tipo) {
      puntosObtenidos += 3; // Puntuación muy reducida
    }
    
    // Coincidencia de palabras únicas (peso: 5% - muy reducido)
    puntosTotales += 5;
    if (carac1.palabrasUnicas && carac2.palabrasUnicas) {
      const palabrasComunes = Array.from(carac1.palabrasUnicas).filter(p1 => 
        carac2.palabrasUnicas.has(p1)
      );
      const palabrasIgnoradas = ['refresco', 'bebida', 'lata', 'botella', 'pack']; // Palabras genéricas que no aportan
      const palabrasRelevantes = palabrasComunes.filter(p => !palabrasIgnoradas.includes(p));
      
      if (palabrasRelevantes.length > 0) {
        const porcentajePalabras = palabrasRelevantes.length / Math.max(carac1.palabrasUnicas.size, carac2.palabrasUnicas.size);
        puntosObtenidos += Math.round(porcentajePalabras * 5);
        console.log('✅ Palabras comunes relevantes:', palabrasRelevantes);
      }
    }
    
    const similitudFinal = Math.round((puntosObtenidos / puntosTotales) * 100);
    console.log(`📊 Similitud calculada: ${puntosObtenidos}/${puntosTotales} = ${similitudFinal}%`);
    
    return similitudFinal;
  };

  // Normalizar tamaños a litros para comparación
  const normalizarTamaño = (tamaño, unidad) => {
    const num = parseFloat(tamaño);
    switch (unidad.toLowerCase()) {
      case 'ml': return num / 1000;
      case 'cl': return num / 100;
      case 'l':
      case 'litro':
      case 'litros': return num;
      default: return num / 1000; // Asumir ml por defecto
    }
  };

  // Filtrar productos para la búsqueda con algoritmo mejorado
  const filtrarProductos = (busqueda) => {
    if (!busqueda || busqueda.length < 2) return [];
    
    console.log(`🔍 Filtrando productos con búsqueda: "${busqueda}"`);
    console.log(`📦 Total productos disponibles: ${productosExistentes?.length || 0}`);
    
    const busquedaLower = busqueda.toLowerCase();
    
    // Crear array de productos con score de relevancia
    const productosConScore = productosExistentes.map(producto => {
      let score = 0;
      const nombreLower = producto.nombre.toLowerCase();
      const codigoLower = (producto.codigo || producto.codigoBarra || '').toLowerCase();
      
      // Coincidencia exacta en código (score máximo: 100)
      if (codigoLower === busquedaLower) {
        score = 100;
      }
      // Coincidencia exacta en nombre (score: 95)
      else if (nombreLower === busquedaLower) {
        score = 95;
      }
      // Nombre empieza con la búsqueda (score: 80)
      else if (nombreLower.startsWith(busquedaLower)) {
        score = 80;
      }
      // Código contiene la búsqueda (score: 70)
      else if (codigoLower.includes(busquedaLower)) {
        score = 70;
      }
      // Búsqueda avanzada por características
      else {
        const caracteristicasBusqueda = extraerCaracteristicas(busquedaLower);
        const caracteristicasProducto = extraerCaracteristicas(nombreLower);
        score = calcularSimilitud(caracteristicasBusqueda, caracteristicasProducto);
      }
      
      return { ...producto, score };
    })
    .filter(producto => producto.score > 40) // Solo mostrar productos con score > 40%
    .sort((a, b) => b.score - a.score) // Ordenar por relevancia
    .slice(0, 10); // Limitar a 10 resultados
    
    console.log(`✅ Encontrados ${productosConScore.length} productos relevantes`);
    console.log('Resultados:', productosConScore.map(p => ({ 
      nombre: p.nombre, 
      score: p.score 
    })));
    
    return productosConScore;
  };

  // Asignar producto existente a un producto extraído
  const asignarProducto = (indice, productoExistente) => {
    const nuevosProductos = [...productosEditables];
    nuevosProductos[indice] = {
      ...nuevosProductos[indice],
      productoExistente: productoExistente,
      codigo: productoExistente?.codigo || productoExistente?.codigoBarra || nuevosProductos[indice].codigo,
      editado: true
    };
    setProductosEditables(nuevosProductos);
    setProductoSeleccionado(null);
    setBusquedaProducto('');
  };

  // Editar datos del producto
  const editarProducto = (indice, campo, valor) => {
    const nuevosProductos = [...productosEditables];
    nuevosProductos[indice] = {
      ...nuevosProductos[indice],
      [campo]: valor,
      editado: true
    };
    setProductosEditables(nuevosProductos);
  };

  // Validar producto
  const validarProducto = (indice) => {
    const producto = productosEditables[indice];
    const errores = [];

    if (!producto.nombre || producto.nombre.trim().length < 2) {
      errores.push('El nombre es obligatorio');
    }
    if (!producto.cantidad || producto.cantidad <= 0) {
      errores.push('La cantidad debe ser mayor a 0');
    }
    if (!producto.precioUnitario || producto.precioUnitario <= 0) {
      errores.push('El precio debe ser mayor a 0');
    }

    const nuevosProductos = [...productosEditables];
    nuevosProductos[indice] = {
      ...nuevosProductos[indice],
      errores: errores,
      validado: errores.length === 0
    };
    setProductosEditables(nuevosProductos);

    return errores.length === 0;
  };

  // Eliminar producto
  const eliminarProducto = (indice) => {
    const nuevosProductos = productosEditables.filter((_, i) => i !== indice);
    setProductosEditables(nuevosProductos);
  };

  // Guardar todos los productos editados
  const guardarProductos = () => {
    // Validar todos los productos
    let todosValidos = true;
    const productosValidados = productosEditables.map((producto, indice) => {
      const valido = validarProducto(indice);
      if (!valido) todosValidos = false;
      return productosEditables[indice];
    });

    if (!todosValidos) {
      alert('❌ Por favor corrige los errores antes de guardar');
      return;
    }

    // Convertir a formato esperado
    const productosFinales = productosValidados.map(producto => ({
      codigo: producto.codigo || `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: producto.nombre.trim(),
      cantidad: parseInt(producto.cantidad),
      precioUnitario: parseFloat(producto.precioUnitario),
      total: (parseInt(producto.cantidad) * parseFloat(producto.precioUnitario)).toFixed(2),
      productoExistente: producto.productoExistente // Información del producto existente para la actualización
    }));

    onProductosEditados(productosFinales);
    onCerrar();
  };

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Productos Extraídos
              </h3>
              <p className="text-gray-600">
                Revisa y edita los productos extraídos antes de guardar la factura
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Información de ayuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sistema de Asignación Inteligente Mejorado:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Marcas diferentes = 0% similitud</strong> (ej: Fanta ≠ Aquarius)</li>
                <li><strong>Sabores diferentes = máximo 15% similitud</strong></li>
                <li>Solo se asignan productos con <strong>85% o más de similitud</strong></li>
                <li>Revisa todas las asignaciones antes de guardar</li>
                <li>Los precios deben ser de <strong>compra al proveedor</strong>, no de venta</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {productosEditables.map((producto, indice) => (
            <div 
              key={indice} 
              className={`border rounded-lg p-4 ${
                producto.validado ? 'border-green-200 bg-green-50' : 
                producto.errores.length > 0 ? 'border-red-200 bg-red-50' : 
                'border-gray-200 bg-white'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Datos del producto */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Producto {indice + 1}</h4>
                    <div className="flex items-center space-x-2">
                      {producto.validado ? (
                        <span className="flex items-center text-green-600 text-sm">
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Validado
                        </span>
                      ) : (
                        <button
                          onClick={() => validarProducto(indice)}
                          className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Validar
                        </button>
                      )}
                      <button
                        onClick={() => eliminarProducto(indice)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Errores */}
                  {producto.errores.length > 0 && (
                    <div className="bg-red-100 border border-red-300 rounded p-2">
                      <p className="text-red-700 text-sm font-medium">Errores:</p>
                      <ul className="text-red-600 text-xs list-disc list-inside">
                        {producto.errores.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Campos editables */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        value={producto.codigo || ''}
                        onChange={(e) => editarProducto(indice, 'codigo', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Código del producto"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={producto.cantidad || ''}
                        onChange={(e) => editarProducto(indice, 'cantidad', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={producto.nombre || ''}
                      onChange={(e) => editarProducto(indice, 'nombre', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Precio Unitario (Compra) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={producto.precioUnitario || ''}
                        onChange={(e) => editarProducto(indice, 'precioUnitario', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Precio que pagas al proveedor
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <input
                        type="text"
                        value={`€${((producto.cantidad || 0) * (producto.precioUnitario || 0)).toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Asignación de producto existente */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Asignar a Producto Existente</h5>
                  
                  {producto.productoExistente ? (
                    <div className="bg-green-100 border border-green-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-green-700 font-medium text-sm">
                            Producto Asignado
                          </span>
                          {producto.productoExistente.scoreAsignacion && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded ${
                              producto.productoExistente.scoreAsignacion >= 95 ? 'bg-green-200 text-green-800' :
                              producto.productoExistente.scoreAsignacion >= 90 ? 'bg-yellow-200 text-yellow-800' :
                              'bg-orange-200 text-orange-800'
                            }`}>
                              {producto.productoExistente.scoreAsignacion}% confianza
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => asignarProducto(indice, null)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-sm text-green-800">
                        <p className="font-medium">{producto.productoExistente.nombre}</p>
                        <p className="text-xs">
                          Código: {producto.productoExistente.codigo || producto.productoExistente.codigoBarra} | 
                          Stock: {producto.productoExistente.stock} | 
                          Precio venta: €{producto.productoExistente.precio}
                        </p>
                        {producto.productoExistente.scoreAsignacion && producto.productoExistente.scoreAsignacion < 95 && (
                          <p className="text-xs text-orange-700 mt-1 font-medium">
                            ⚠️ Revisa esta asignación - confianza media/baja
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex">
                        <input
                          type="text"
                          value={busquedaProducto}
                          onChange={(e) => setBusquedaProducto(e.target.value)}
                          onFocus={() => setProductoSeleccionado(indice)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Buscar producto existente..."
                        />
                        <button className="px-2 py-1 bg-gray-200 border border-l-0 border-gray-300 rounded-r">
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>

                      {/* Resultados de búsqueda */}
                      {productoSeleccionado === indice && busquedaProducto.length >= 2 && (
                        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded bg-white shadow-lg">
                          {filtrarProductos(busquedaProducto).map((producto_db) => (
                            <button
                              key={producto_db.id}
                              onClick={() => asignarProducto(indice, producto_db)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="text-sm">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{producto_db.nombre}</p>
                                    <p className="text-xs text-gray-600">
                                      {producto_db.codigo || producto_db.codigoBarra} | Stock: {producto_db.stock} | €{producto_db.precio}
                                    </p>
                                  </div>
                                  <div className="ml-2">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      producto_db.score >= 85 ? 'bg-green-100 text-green-700' :
                                      producto_db.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {producto_db.score}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                          {filtrarProductos(busquedaProducto).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No se encontraron productos similares
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        💡 Si no asignas un producto existente, se creará uno nuevo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="text-sm text-gray-600">
            {productosEditables.filter(p => p.validado).length} de {productosEditables.length} productos validados
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCerrar}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              onClick={guardarProductos}
              disabled={productosEditables.length === 0}
              className={`flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                productosEditables.length === 0
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Guardar Productos ({productosEditables.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorProductosExtraidos;
