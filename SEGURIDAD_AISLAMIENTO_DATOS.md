# Seguridad y Aislamiento de Datos por Usuario - TPV App

## 🔒 Principios de Seguridad

### Aislamiento Total por Usuario
Cada usuario del sistema TPV tiene **acceso exclusivo** a sus propios datos:

- ✅ **Sus productos** - Solo puede ver/editar productos que él creó
- ✅ **Sus facturas** - Solo puede ver/editar facturas que él registró  
- ✅ **Sus ventas** - Solo puede ver/editar ventas que él realizó
- ✅ **Su configuración** - Solo puede ver/editar su configuración de tienda
- ✅ **Sus clientes** - Solo puede ver/editar clientes que él agregó

### Lo que NO puede hacer un usuario:
- ❌ Ver productos de otros usuarios
- ❌ Ver facturas de otros usuarios  
- ❌ Ver ventas de otros usuarios
- ❌ Modificar configuraciones de otros usuarios
- ❌ Acceder a archivos de otros usuarios en Storage

## 🔧 Implementación Técnica

### 1. Filtrado en el Frontend
```javascript
// ✅ CORRECTO: Filtrar por usuario en todas las consultas
const q = query(
  collection(db, 'productos'), 
  where('usuario', '==', usuario.email)
);

// ❌ INCORRECTO: Cargar todos los productos sin filtro
const snapshot = await getDocs(collection(db, 'productos'));
```

### 2. Validación en el Backend (Reglas Firestore)
```javascript
// Solo permitir acceso a documentos del usuario autenticado
match /productos/{productoId} {
  allow read, write: if request.auth != null 
    && request.auth.token.email != null
    && resource.data.usuario == request.auth.token.email;
}
```

### 3. Estructura de Documentos
Todos los documentos deben incluir el campo `usuario`:
```javascript
{
  "nombre": "Coca-Cola",
  "precio": 1.50,
  "usuario": "tienda1@email.com",  // ← OBLIGATORIO
  // ... otros campos
}
```

## 📋 Checklist de Seguridad

### ✅ Frontend (Aplicación)
- [x] Todas las consultas incluyen filtro `where('usuario', '==', usuario.email)`
- [x] Los documentos se crean con `usuario: usuario.email`
- [x] La búsqueda de productos filtra por usuario
- [x] Las actualizaciones verifican que el producto pertenezca al usuario
- [x] El diagnóstico muestra datos específicos del usuario

### ✅ Backend (Firebase)
- [ ] Reglas de Firestore implementadas correctamente
- [ ] Índices creados para consultas con filtro de usuario
- [ ] Reglas de Storage configuradas por usuario
- [ ] Tests de seguridad realizados

### ✅ Datos
- [x] Todos los documentos incluyen campo `usuario`
- [x] Los datos de ejemplo respetan el aislamiento
- [x] Las migraciones preservan la propiedad de datos

## 🧪 Testing de Seguridad

### Pruebas que debes hacer:

1. **Crear dos usuarios diferentes:**
   - `usuario1@test.com`
   - `usuario2@test.com`

2. **Con usuario1:**
   - Crear productos
   - Registrar facturas
   - Realizar ventas

3. **Con usuario2:**
   - Verificar que NO ve productos de usuario1
   - Verificar que NO ve facturas de usuario1
   - Crear sus propios datos

4. **Verificar aislamiento:**
   - Cada usuario solo ve sus propios datos
   - Las búsquedas no devuelven datos de otros usuarios
   - Las actualizaciones no afectan datos de otros usuarios

## 🚨 Señales de Problemas de Seguridad

### En los Logs:
```
❌ PELIGRO: productos cargados (todos los productos)
❌ PELIGRO: Cargando sin filtro de usuario
❌ PELIGRO: Usuario sin especificar en documento
```

### En la Aplicación:
- Ver productos que no creaste
- Ver facturas de otros proveedores que no registraste
- Números de stock que no coinciden con tu inventario
- Configuraciones que no reconoces

## 🔧 Solución a Problemas Comunes

### Problema: "Veo productos que no creé"
```javascript
// Verificar que las consultas incluyan filtro de usuario
const q = query(
  collection(db, 'productos'), 
  where('usuario', '==', usuario.email) // ← Asegurar que esté presente
);
```

### Problema: "No puedo guardar productos"
```javascript
// Verificar que el documento incluya campo usuario
const producto = {
  nombre: 'Mi Producto',
  precio: 10.00,
  usuario: usuario.email, // ← OBLIGATORIO
  // ... otros campos
};
```

### Problema: "Error de permisos"
1. Verificar reglas de Firestore
2. Confirmar que el índice existe
3. Verificar autenticación del usuario

## 📊 Estructura Recomendada

### Base de Datos:
```
/productos/{productoId}
  - usuario: "tienda1@email.com"
  - nombre: "Producto X"
  - precio: 10.00
  
/facturas/{facturaId}  
  - usuario: "tienda1@email.com"
  - numeroFactura: "FAC-001"
  - productos: [...]
  
/configuraciones/{configId}
  - usuario: "tienda1@email.com"
  - nombreTienda: "Mi Tienda"
  - direccion: "..."
```

### Storage:
```
/facturas/tienda1@email.com/archivo1.pdf
/facturas/tienda2@email.com/archivo2.pdf
/productos/tienda1@email.com/imagen1.jpg
```

## 🎯 Beneficios del Aislamiento

1. **Privacidad:** Cada negocio mantiene sus datos privados
2. **Seguridad:** Imposible acceso accidental a datos de terceros  
3. **Escalabilidad:** Sistema puede soportar múltiples negocios
4. **Compliance:** Cumple con regulaciones de protección de datos
5. **Confianza:** Los usuarios confían en que sus datos están seguros

## 🔄 Migración de Datos Existentes

Si ya tienes datos sin campo `usuario`:

```javascript
// Script de migración (ejecutar en consola de Firebase)
async function migrarDatos() {
  const productos = await db.collection('productos').get();
  
  productos.docs.forEach(async (doc) => {
    if (!doc.data().usuario) {
      await doc.ref.update({
        usuario: 'admin@tuempresa.com' // Usuario por defecto
      });
    }
  });
}
```

---

**⚠️ IMPORTANTE:** La seguridad de datos es fundamental. Asegúrate de que todas las implementaciones respeten estos principios antes de usar el sistema en producción.
