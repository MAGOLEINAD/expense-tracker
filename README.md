# Organizador de Gastos

Aplicación web para gestionar gastos mensuales basada en tu plantilla de Excel. Cada usuario tiene sus propios datos aislados.

## Características

- **Autenticación con Google** mediante Firebase Auth
- **Base de datos Firestore** - cada usuario solo ve sus propios gastos
- **Categorías personalizadas** según tu plantilla:
  - Impuestos, Servicios e Inversiones
  - Servicios y Tarjetas
  - Ford Ka + SEL AT
- **Multi-moneda**: Pesos argentinos ($) y Dólares (USD)
- **Gestión completa**: Agregar, editar, eliminar gastos
- **Filtrado por mes y año**
- **Estados**: Pagado, Bonificado, Pendiente
- **Totales automáticos** por categoría y general

## Configuración Inicial

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Activa **Google Authentication**:
   - Authentication → Sign-in method → Google → Enable
4. Crea una base de datos **Firestore**:
   - Firestore Database → Create database → Start in production mode

### 2. Obtener credenciales de Firebase

En la configuración del proyecto (Project Settings):
1. Scroll hasta "Your apps"
2. Click en el ícono web (</>)
3. Registra tu app
4. Copia las credenciales del `firebaseConfig`

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y pega tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

## Deployment en Firebase Hosting

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login en Firebase

```bash
firebase login
```

### 3. Inicializar Firebase (solo primera vez)

```bash
firebase init
```

Selecciona:
- **Hosting**: Configure files for Firebase Hosting
- **Firestore**: Deploy Firestore security rules and indexes
- Usa el proyecto existente que creaste
- Public directory: `dist`
- Single-page app: **Yes**
- GitHub integration: No (opcional)

### 4. Build y Deploy

```bash
npm run build
firebase deploy
```

Tu app estará live en: `https://tu-proyecto.web.app`

## Estructura del Proyecto

```
expense-tracker/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx        # Panel principal
│   │   ├── ExpenseDialog.tsx    # Modal para agregar/editar
│   │   ├── ExpenseTable.tsx     # Tabla por categoría
│   │   └── Login.tsx            # Pantalla de login
│   ├── contexts/
│   │   └── AuthContext.tsx      # Manejo de autenticación
│   ├── hooks/
│   │   └── useExpenses.ts       # CRUD de gastos
│   ├── firebase.ts              # Configuración Firebase
│   ├── types.ts                 # Tipos TypeScript
│   └── App.tsx                  # Componente principal
├── firestore.rules              # Reglas de seguridad
├── firestore.indexes.json       # Índices de Firestore
├── firebase.json                # Config de deployment
└── .env                         # Variables de entorno
```

## Seguridad

- Las reglas de Firestore garantizan que cada usuario solo pueda leer/escribir sus propios gastos
- La autenticación es requerida para todas las operaciones
- Los datos están aislados por `userId`

## Tecnologías

- **React 18** con TypeScript
- **Vite** como build tool
- **Material UI** para el diseño
- **Firebase Auth** para autenticación
- **Firestore** como base de datos
- **date-fns** para manejo de fechas

## Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter
firebase deploy      # Deploy a Firebase
```

## Soporte

Si encuentras problemas, verifica:
1. Las credenciales de Firebase en `.env`
2. Que Google Auth esté activado en Firebase Console
3. Que la base de datos Firestore esté creada
4. Las reglas de seguridad de Firestore estén deployadas
