# Configuración Firebase para TPV App

## Reglas de Firestore (SEGURIDAD POR USUARIO)

Ve a **Firebase Console → Firestore Database → Rules** y usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // REGLAS ESPECÍFICAS POR COLECCIÓN - AISLAMIENTO TOTAL POR USUARIO
    
    // Facturas: Solo el propietario puede acceder
    match /facturas/{facturaId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email != null
        && resource.data.usuario == request.auth.token.email;
      
      // Permitir creación si el usuario del documento coincide con el autenticado
      allow create: if request.auth != null 
        && request.auth.token.email != null
        && request.resource.data.usuario == request.auth.token.email;
    }
    
    // Productos: Solo el propietario puede acceder
    match /productos/{productoId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email != null
        && resource.data.usuario == request.auth.token.email;
      
      // Permitir creación si el usuario del documento coincide con el autenticado
      allow create: if request.auth != null 
        && request.auth.token.email != null
        && request.resource.data.usuario == request.auth.token.email;
    }
    
    // Configuraciones: Solo el propietario puede acceder
    match /configuraciones/{configId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email != null
        && resource.data.usuario == request.auth.token.email;
      
      // Permitir creación si el usuario del documento coincide con el autenticado
      allow create: if request.auth != null 
        && request.auth.token.email != null
        && request.resource.data.usuario == request.auth.token.email;
    }
    
    // Ventas: Solo el propietario puede acceder
    match /ventas/{ventaId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email != null
        && resource.data.usuario == request.auth.token.email;
      
      // Permitir creación si el usuario del documento coincide con el autenticado
      allow create: if request.auth != null 
        && request.auth.token.email != null
        && request.resource.data.usuario == request.auth.token.email;
    }
    
    // Clientes: Solo el propietario puede acceder (si tienes esta colección)
    match /clientes/{clienteId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email != null
        && resource.data.usuario == request.auth.token.email;
      
      // Permitir creación si el usuario del documento coincide con el autenticado
      allow create: if request.auth != null 
        && request.auth.token.email != null
        && request.resource.data.usuario == request.auth.token.email;
    }
    
    // PROHIBIR TODO LO DEMÁS
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Reglas de Storage (SEGURIDAD POR USUARIO)

Ve a **Firebase Console → Storage → Rules** y usa estas reglas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Solo permitir acceso a carpetas del usuario autenticado
    match /facturas/{userId}/{fileName} {
      allow read, write: if request.auth != null 
        && request.auth.token.email == userId;
    }
    
    match /productos/{userId}/{fileName} {
      allow read, write: if request.auth != null 
        && request.auth.token.email == userId;
    }
    
    match /configuraciones/{userId}/{fileName} {
      allow read, write: if request.auth != null 
        && request.auth.token.email == userId;
    }
    
    // PROHIBIR TODO LO DEMÁS
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Índices de Firestore (OBLIGATORIOS)

⚠️ **IMPORTANTE:** Debes crear estos índices para que las consultas funcionen correctamente.

Ve a **Firebase Console → Firestore Database → Indexes** y crea:

### Índice para Facturas (OBLIGATORIO)
- **Colección:** `facturas`
- **Campos:** 
  - `usuario` (Ascending)
  - `fecha` (Descending)
- **Estado:** Necesario para consultas de facturas por usuario ordenadas por fecha

### Índice para Productos (OBLIGATORIO)
- **Colección:** `productos`
- **Campos:**
  - `usuario` (Ascending) 
  - `nombre` (Ascending)
- **Estado:** Necesario para búsquedas de productos por usuario

### Índice para Ventas (OBLIGATORIO si tienes ventas)
- **Colección:** `ventas`
- **Campos:**
  - `usuario` (Ascending)
  - `fecha` (Descending)

### Índice para Configuraciones (OBLIGATORIO)
- **Colección:** `configuraciones`
- **Campos:**
  - `usuario` (Ascending)

### Cómo Crear los Índices:

1. Ve a **Firebase Console**
2. Selecciona tu proyecto
3. Ve a **Firestore Database → Indexes**
4. Haz clic en **"Create Index"**
5. Rellena los campos según las especificaciones arriba
6. Haz clic en **"Create"**
7. Espera a que el índice se construya (puede tardar varios minutos)

### Comando Automático (Opcional):

Si tienes Firebase CLI instalado, puedes usar este archivo `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "facturas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "usuario",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fecha",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "productos",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "usuario",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "nombre",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "ventas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "usuario",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fecha",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Luego ejecuta: `firebase deploy --only firestore:indexes`

## Estructura de Colecciones

### Colección: `facturas`
```json
{
  "numeroFactura": "FAC-2025-001",
  "proveedor": "Proveedor S.L.",
  "fecha": "2025-06-27",
  "total": 123.45,
  "productos": [...],
  "archivoUrl": "https://...",
  "usuario": "usuario@email.com",
  "fechaCreacion": "2025-06-27T10:30:00Z",
  "procesada": true
}
```

### Colección: `productos`
```json
{
  "codigo": "123456789",
  "codigoBarra": "123456789", 
  "nombre": "Producto Ejemplo",
  "precio": 1.50,
  "precioCosto": 1.20,
  "stock": 100,
  "categoria": "Bebidas",
  "usuario": "usuario@email.com",
  "fechaCreacion": "2025-06-27T10:30:00Z",
  "activo": true
}
```

### Colección: `configuraciones`
```json
{
  "usuario": "usuario@email.com",
  "nombreTienda": "Mi Tienda",
  "direccionTienda": "Calle Principal 123", 
  "telefonoTienda": "+34 123 456 789",
  "nombreCajero": "Juan Pérez",
  "impresoraHabilitada": true,
  "anchoTicket": 280,
  "copiesTicket": 1,
  "cortarPapel": true,
  "logoTienda": "data:image/...",
  "mensajePie": "Gracias por su compra!"
}
```

## Pasos para Solucionar Problemas

1. **Ejecutar Diagnóstico:** Usa el botón "Diagnóstico" en la app
2. **Crear Colección:** Usa el botón "Crear Colección" si está vacía
3. **Verificar Reglas:** Asegúrate de que las reglas permiten acceso
4. **Verificar Autenticación:** El usuario debe estar logueado
5. **Revisar Consola:** Busca errores específicos en F12

## Comandos Útiles

### Limpiar Cache del Navegador
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Reiniciar Servidor de Desarrollo
```bash
# Parar servidor
Ctrl + C

# Limpiar y reiniciar
npm run build
npm run dev
```

### Verificar Firebase Config
```javascript
// En la consola del navegador
console.log('Firebase config:', firebase.app().options);
```

## Contacto

Si persisten los problemas:
1. Captura de pantalla del error
2. Resultado del diagnóstico
3. Logs de la consola del navegador
4. Configuración de Firebase utilizada
