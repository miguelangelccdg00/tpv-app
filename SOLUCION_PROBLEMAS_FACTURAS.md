# Solución de Problemas - Sistema de Facturas TPV

## Problemas de Guardado de Facturas

Si tienes problemas guardando facturas, sigue estos pasos:

### 1. Usar el Botón de Diagnóstico

1. En la página de **Facturas de Proveedores**
2. Haz clic en el botón **"Diagnóstico"** (morado)
3. Revisa los resultados mostrados

### 2. Errores Comunes y Soluciones

#### Error CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solución:**
- Verifica tu conexión a internet
- Reinicia el servidor de desarrollo
- Comprueba que el dominio esté autorizado en Firebase Console

#### Error de Permisos
```
Permission denied / Unauthorized
```

**Solución:**
- Verifica que estés autenticado correctamente
- Comprueba las reglas de Firestore en Firebase Console
- Asegúrate de que tu email tenga permisos

#### Error de Red
```
Network error / Failed to fetch
```

**Solución:**
- Verifica tu conexión a internet
- Comprueba que Firebase esté activo
- Intenta refrescar la página

### 3. Verificación Manual

#### Paso 1: Verificar Autenticación
```javascript
// En la consola del navegador
console.log('Usuario actual:', usuario);
```

#### Paso 2: Verificar Productos
```javascript
// En la consola del navegador
console.log('Productos cargados:', productos.length);
```

#### Paso 3: Probar Firestore
1. Ve a Firebase Console → Firestore Database
2. Verifica que las colecciones existan
3. Comprueba las reglas de seguridad

### 4. Reglas de Firestore Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Configuración de Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Pasos de Emergencia

Si nada funciona:

1. **Limpiar Cache:**
   - Ctrl + Shift + R (recarga forzada)
   - Abrir herramientas de desarrollador → Application → Clear Storage

2. **Verificar Firebase Config:**
   - Revisar `client/src/firebase.js`
   - Confirmar que las credenciales sean correctas

3. **Reiniciar Servicios:**
   ```bash
   # Parar el servidor
   Ctrl + C
   
   # Limpiar cache
   npm run build
   
   # Reiniciar
   npm run dev
   ```

4. **Revisar Console Logs:**
   - F12 → Console
   - Buscar errores específicos
   - Copiar el error completo para diagnóstico

### 7. Información para Soporte

Si sigues teniendo problemas, proporciona esta información:

- **Error específico:** Copia el mensaje de error completo
- **Diagnóstico:** Resultado del botón "Diagnóstico"
- **Pasos realizados:** Qué has intentado hacer
- **Navegador:** Chrome/Firefox/Safari versión X
- **Datos de prueba:** ¿Funciona con los datos de ejemplo?

### 8. Logs Útiles

El sistema genera logs detallados en la consola:

```
🚀 Iniciando guardado de factura...
📋 Datos de la factura: {...}
📤 Subiendo archivo...
💾 Guardando factura en Firestore...
✅ Factura guardada con ID: abc123
📦 Iniciando actualización de stock...
✅ Stock actualizado correctamente
```

Si algún paso falla, el error aparecerá con ❌.

### 9. Modo Debug

Usa el botón **"🐛 Debug"** para ver:
- Usuario actual
- Cantidad de productos cargados
- Información detallada en consola

---

## Contacto

Si persisten los problemas, contacta al desarrollador con:
1. Captura de pantalla del error
2. Resultado del diagnóstico
3. Logs de la consola
