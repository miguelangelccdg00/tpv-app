# Sistema de Edición y Asignación de Productos Extraídos

## 📋 Descripción

Esta funcionalidad permite a los usuarios editar y asignar manualmente productos extraídos por OCR antes de guardar una factura. Es especialmente útil para:

- Corregir errores del OCR (nombre, cantidad, precio)
- Asignar productos extraídos a productos existentes en el inventario
- Mantener la consistencia en el catálogo de productos
- Evitar duplicados innecesarios

## 🚀 Características

### Editor de Productos Extraídos

- **Edición Individual**: Cada producto puede editarse individualmente
- **Validación en Tiempo Real**: Valida datos mientras editas
- **Búsqueda de Productos**: Busca productos existentes por nombre o código
- **Asignación Automática**: Sugerencias automáticas de productos similares
- **Fuzzy Search**: Encuentra productos aunque el nombre no coincida exactamente

### Flujo de Trabajo

1. **Análisis OCR**: El sistema extrae productos automáticamente
2. **Revisión**: Se muestran los productos extraídos con sugerencias
3. **Edición**: El usuario puede editar nombre, cantidad, precio
4. **Asignación**: Se pueden asignar a productos existentes
5. **Validación**: Cada producto debe validarse antes de guardar
6. **Guardado**: Se actualiza el stock según las asignaciones

## 🔧 Componentes

### `EditorProductosExtraidos.jsx`
- **Ubicación**: `client/src/components/Pages/Facturas/EditorProductosExtraidos.jsx`
- **Función**: Interfaz principal para editar productos
- **Props**:
  - `productosExtraidos`: Array de productos del OCR
  - `productosExistentes`: Catálogo actual de productos
  - `onProductosEditados`: Callback con productos finales
  - `onCerrar`: Callback para cerrar el editor

### `AnalizadorFacturas.jsx` (Modificado)
- **Nuevas funciones**:
  - Botón "Editar y Asignar Productos"
  - Integración con el editor
  - Flujo de productos editados

### `FacturasPage.jsx` (Modificado)
- **Mejoras**:
  - Pasa productos existentes al analizador
  - Maneja productos asignados en `actualizarStock`
  - Feedback mejorado al usuario

## 📊 Algoritmo de Búsqueda

### Prioridades de Coincidencia

1. **Código Exacto**: Busca por código de barras idéntico
2. **Nombre Exacto**: Busca por nombre completo idéntico
3. **Palabras Clave**: Busca productos que contengan palabras del nombre extraído
4. **Sin Coincidencia**: No se asigna automáticamente

### Función `buscarProductoSimilar`

```javascript
const buscarProductoSimilar = (productoExtraido, productosDB) => {
  // 1. Buscar por código exacto
  let coincidencia = productosDB.find(p => 
    p.codigo && productoExtraido.codigo && 
    p.codigo.toLowerCase().trim() === productoExtraido.codigo.toLowerCase().trim()
  );

  // 2. Buscar por nombre exacto
  if (!coincidencia) {
    coincidencia = productosDB.find(p => 
      p.nombre && p.nombre.toLowerCase().trim() === nombreExtraido
    );
  }

  // 3. Buscar por palabras clave
  if (!coincidencia) {
    const palabrasExtraidas = nombreExtraido.split(' ').filter(p => p.length > 2);
    coincidencia = productosDB.find(p => {
      const nombreDB = p.nombre.toLowerCase();
      return palabrasExtraidas.some(palabra => nombreDB.includes(palabra));
    });
  }

  return coincidencia || null;
};
```

## 🎯 Estados de Productos

### Estados Posibles

- **Sin Editar**: Producto recién extraído
- **Editado**: Usuario modificó algún campo
- **Validado**: Todos los campos son correctos
- **Con Errores**: Falta información obligatoria

### Indicadores Visuales

- 🟢 **Verde**: Producto validado correctamente
- 🔴 **Rojo**: Producto con errores
- ⚪ **Blanco**: Producto sin validar
- 🔵 **Azul**: Producto asignado a uno existente

## 💡 Casos de Uso

### Caso 1: Producto Existente con Nombre Similar
**Extraído**: "Coca Cola 330ml"
**Existente**: "Coca-Cola Original Lata 330ml"
**Acción**: Se sugiere automáticamente, usuario confirma

### Caso 2: Error de OCR en Cantidad
**Extraído**: "Coca-Cola Original", cantidad "2O" (OCR confunde 0 con O)
**Acción**: Usuario corrige a "20"

### Caso 3: Precio Incorrecto
**Extraído**: Precio "12.0" (falta decimal)
**Acción**: Usuario corrige a "1.20"

### Caso 4: Producto Nuevo
**Extraído**: "Red Bull Energy 250ml"
**Existente**: No hay similar
**Acción**: Se crea producto nuevo con los datos editados

## 🔄 Flujo de Actualización de Stock

### Para Productos Asignados
```javascript
// Se actualiza el producto existente asignado
await updateDoc(doc(db, 'productos', productoExistente.id), {
  stock: nuevoStock,
  precioCosto: productoFactura.precioUnitario,
  ultimaCompra: { /* datos de compra */ }
});
```

### Para Productos Nuevos
```javascript
// Se crea un nuevo producto
const nuevoProducto = {
  codigo: productoFactura.codigo,
  nombre: productoFactura.nombre,
  stock: productoFactura.cantidad,
  precio: precioVentaSugerido, // +30% margen
  precioCosto: productoFactura.precioUnitario
};
```

## ⚠️ Validaciones

### Campos Obligatorios
- **Nombre**: Mínimo 2 caracteres
- **Cantidad**: Mayor a 0
- **Precio**: Mayor a 0

### Validaciones Opcionales
- **Código**: Puede generarse automáticamente si está vacío
- **Asignación**: Opcional, se puede crear producto nuevo

## 🎨 Interfaz de Usuario

### Características de UX
- **Feedback Visual**: Colores indican el estado de cada producto
- **Búsqueda en Tiempo Real**: Resultados mientras escribes
- **Validación Interactiva**: Errores mostrados inmediatamente
- **Contador de Progreso**: Muestra productos validados
- **Instrucciones Claras**: Tooltips y mensajes de ayuda

### Responsive Design
- **Desktop**: Dos columnas (edición + asignación)
- **Mobile**: Una columna apilada
- **Scroll**: Lista de productos con scroll independiente

## 🔮 Futuras Mejoras

### Funcionalidades Planeadas
1. **IA Mejorada**: Mejor reconocimiento de productos similares
2. **Historial**: Guardar correcciones frecuentes del OCR
3. **Plantillas**: Facturas recurrentes del mismo proveedor
4. **Batch Edit**: Edición masiva de múltiples productos
5. **Machine Learning**: Aprender de correcciones anteriores

### Optimizaciones Técnicas
1. **Caché**: Cachear búsquedas de productos
2. **Debounce**: Optimizar búsqueda en tiempo real
3. **Virtual Scroll**: Para listas muy largas de productos
4. **Web Workers**: OCR en background

## 📝 Notas de Desarrollo

- Los productos asignados mantienen referencia al producto existente
- La función `actualizarStock` detecta asignaciones automáticamente
- El componente es completamente modular y reutilizable
- Usa React hooks para estado local sin Redux
- Compatible con la estructura existente de Firestore

## 🧪 Testing

Para probar la funcionalidad:

1. Usar el botón "Cargar Datos Ejemplo"
2. Subir archivo y usar "Analizar Factura con IA"
3. Hacer clic en "Editar y Asignar Productos"
4. Probar búsqueda, edición y validación
5. Guardar y verificar actualización de stock
