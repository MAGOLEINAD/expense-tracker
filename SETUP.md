# Setup Rápido - Organizador de Gastos

## Paso 1: Firebase Console (5 minutos)

### Crear proyecto
1. Ir a: https://console.firebase.google.com/
2. Click "Add project" o "Agregar proyecto"
3. Nombre: `organizador-gastos` (o el que prefieras)
4. Desactiva Google Analytics (opcional)
5. Click "Create project"

### Activar Google Authentication
1. En el menú lateral: **Authentication**
2. Click "Get started"
3. Tab "Sign-in method"
4. Click en "Google"
5. Toggle "Enable"
6. Elige tu email de soporte
7. Click "Save"

### Crear Firestore Database
1. En el menú lateral: **Firestore Database**
2. Click "Create database"
3. Selecciona región más cercana (ej: `southamerica-east1` para Brasil)
4. Start in **production mode**
5. Click "Enable"

### Obtener credenciales
1. Click en el ícono de **Configuración** (⚙️) → Project settings
2. Scroll hasta "Your apps"
3. Click en el ícono **</>** (Web)
4. App nickname: `expense-tracker`
5. NO marques Firebase Hosting aún
6. Click "Register app"
7. **COPIA TODO EL OBJETO `firebaseConfig`**

## Paso 2: Configurar el proyecto localmente

### 2.1 Crear archivo .env

En la carpeta `expense-tracker`, crea el archivo `.env`:

```bash
cd expense-tracker
```

Crea `.env` con este contenido (reemplaza con TUS credenciales):

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

### 2.2 Instalar dependencias (si no lo hiciste)

```bash
npm install
```

### 2.3 Ejecutar en desarrollo

```bash
npm run dev
```

Abre: http://localhost:5173

## Paso 3: Primer uso

1. Click en "Iniciar sesión con Google"
2. Autoriza la aplicación
3. Selecciona mes y año
4. Click "Nuevo Gasto"
5. Completa el formulario y guarda

## Troubleshooting

### Error: "Firebase config is not defined"
→ Verifica que el archivo `.env` esté en la raíz de `expense-tracker` y tenga todas las variables

### Error: "auth/unauthorized-domain"
→ En Firebase Console → Authentication → Settings → Authorized domains
→ Agrega `localhost`

### Error: "Missing or insufficient permissions"
→ En Firebase Console → Firestore Database
→ Ve a "Rules" y ejecuta:
```bash
firebase deploy --only firestore:rules
```

### No se muestran los gastos
→ Abre la consola del navegador (F12)
→ Verifica errores
→ Asegúrate que Firestore indexes estén creados (Firebase Console los sugiere automáticamente)

## Deploy a producción (opcional)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (solo primera vez)
firebase init

# Build y deploy
npm run build
firebase deploy
```

## Estructura de datos en Firestore

```
expenses (collection)
  ├── {expenseId} (document)
  │   ├── userId: "abc123"
  │   ├── item: "Luz"
  │   ├── vto: "2025-12-10"
  │   ├── fechaPago: "2025-12-08"
  │   ├── importe: 45000
  │   ├── currency: "ARS"
  │   ├── pagadoPor: "SRIO SER"
  │   ├── status: "pagado"
  │   ├── category: "IMPUESTOS_SERVICIOS"
  │   ├── month: 12
  │   ├── year: 2025
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp
```

## Próximos pasos

- Personaliza las categorías en `src/types.ts` y componentes
- Ajusta los colores del theme en `src/App.tsx`
- Agrega más campos si necesitas (ej: notas, archivos adjuntos)
- Implementa exportación a Excel/PDF
