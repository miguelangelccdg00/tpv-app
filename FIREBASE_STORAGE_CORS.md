# Configuración de Firebase Storage para CORS

## Problema
Los errores de CORS que ves en la consola indican que Firebase Storage no está configurado para permitir acceso desde localhost durante el desarrollo.

## Solución

### Opción 1: Configurar CORS usando Google Cloud CLI

1. **Instalar Google Cloud CLI** (si no lo tienes):
   ```bash
   # Windows
   choco install gcloudsdk
   # O descargar desde: https://cloud.google.com/sdk/docs/install
   ```

2. **Autenticarse**:
   ```bash
   gcloud auth login
   gcloud config set project TU_PROJECT_ID
   ```

3. **Aplicar configuración CORS**:
   ```bash
   gcloud storage buckets update gs://TU_PROJECT_ID.appspot.com --cors-file=cors.json
   ```

### Opción 2: Configurar desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Storage** → **Rules**
4. Asegúrate de que las reglas permiten acceso para usuarios autenticados:

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

### Opción 3: Usar Firebase Storage Emulator (Recomendado para desarrollo)

1. **Instalar Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Inicializar emuladores**:
   ```bash
   cd c:\Users\fumop\Documents\DAM\tpv-app
   firebase init emulators
   ```

3. **Configurar emuladores** (seleccionar Storage y Firestore)

4. **Iniciar emuladores**:
   ```bash
   firebase emulators:start
   ```

5. **Actualizar configuración de Firebase** en tu app para usar emuladores durante desarrollo.

## Archivo cors.json incluido

El archivo `cors.json` ya está incluido en el proyecto con la configuración necesaria para localhost.

## Notas importantes

- **Desarrollo**: Usa emuladores para evitar problemas de CORS
- **Producción**: Configura CORS correctamente en Firebase Storage
- **Temporal**: La app continuará funcionando sin archivos adjuntos si Storage falla
