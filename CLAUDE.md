# Proyecto: Organizador de Gastos

## Descripción General
Aplicación web de gestión de gastos mensuales basada en una plantilla de Excel, con autenticación de usuarios y datos aislados por usuario.

## Stack Tecnológico

### Frontend
- **React 19.2.0** con TypeScript
- **Vite 7.2.4** (build tool)
- **Material UI 7.3.6** (componentes UI)
- **Emotion** (styling)
- **date-fns 4.1.0** (manejo de fechas)

### Backend/Servicios
- **Firebase 12.6.0**
  - Firebase Auth (autenticación con Google)
  - Firestore (base de datos NoSQL)
  - Hosting (despliegue opcional)

### Herramientas de Desarrollo
- **TypeScript ~5.9.3**
- **ESLint 9.39.1** (linting)
- **typescript-eslint 8.46.4**

## Estructura del Proyecto

```
expense-tracker/
├── src/
│   ├── components/              # Componentes React organizados por feature
│   │   ├── auth/
│   │   │   └── Login.tsx        # Pantalla de login con Google
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx    # Panel principal con filtros y totales
│   │   └── expenses/
│   │       ├── ExpenseDialog.tsx # Modal para agregar/editar gastos
│   │       └── ExpenseTable.tsx  # Tabla de gastos por categoría
│   ├── contexts/
│   │   └── AuthContext.tsx      # Context para manejo de autenticación
│   ├── hooks/
│   │   └── useExpenses.ts       # Hook personalizado para CRUD de gastos
│   ├── lib/                     # Librerías y configuraciones externas
│   │   └── firebase/
│   │       ├── config.ts        # Configuración de Firebase
│   │       ├── auth.ts          # Auth exports (auth, googleProvider)
│   │       ├── firestore.ts     # Firestore exports (db)
│   │       └── index.ts         # Re-exports centralizados
│   ├── types/                   # Definiciones de tipos TypeScript
│   │   ├── expense.types.ts     # Tipos relacionados con gastos
│   │   ├── auth.types.ts        # Tipos de autenticación
│   │   └── index.ts             # Re-exports de tipos
│   ├── utils/                   # Utilidades y helpers
│   │   ├── constants.ts         # Constantes de la app (categorías, estados, etc.)
│   │   ├── formatters.ts        # Funciones de formateo (moneda, fechas, etc.)
│   │   └── index.ts             # Re-exports de utils
│   ├── App.tsx                  # Componente raíz
│   ├── App.css
│   ├── index.css
│   └── main.tsx                 # Entry point
├── public/                      # Archivos estáticos
├── firestore.rules              # Reglas de seguridad de Firestore
├── firestore.indexes.json       # Índices de la base de datos
├── firebase.json                # Configuración de Firebase Hosting
├── .env.example                 # Plantilla de variables de entorno
├── .env                         # Variables de entorno (NO commitear)
├── README.md                    # Documentación principal
├── CHECKLIST.md                 # Lista de verificación de configuración
├── SETUP.md                     # Guía de configuración
├── claude.md                    # Documentación para Claude (este archivo)
├── package.json
├── tsconfig.json
├── tsconfig.app.json            # Configuración TypeScript con path aliases
├── vite.config.ts               # Configuración Vite con path aliases
└── eslint.config.js
```

## Tipos de Datos Principales

### Expense
```typescript
{
  id?: string;
  userId: string;           // ID del usuario autenticado
  item: string;             // Nombre del gasto
  vto: string;              // Fecha de vencimiento
  fechaPago: string;        // Fecha de pago
  importe: number;          // Monto
  currency: 'ARS' | 'USD';  // Moneda
  pagadoPor: string;        // Quién lo pagó
  status: 'pagado' | 'bonificado' | 'pendiente';
  category: 'IMPUESTOS_SERVICIOS' | 'SERVICIOS_TARJETAS' | 'FORD_KA';
  month: number;            // 1-12
  year: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Características Principales

### Autenticación
- Login con Google mediante Firebase Auth
- Context de autenticación que provee `user` y `loading`
- Protección de rutas: sin login → pantalla Login, con login → Dashboard

### Gestión de Gastos
- **CRUD completo**: Crear, Leer, Actualizar, Eliminar
- **Filtrado**: Por mes y año
- **Categorización**: Tres categorías personalizadas
- **Multi-moneda**: Soporte para ARS y USD
- **Estados**: Pagado, Bonificado, Pendiente

### Seguridad
- Datos aislados por `userId`
- Reglas de Firestore que garantizan que cada usuario solo accede a sus propios datos
- Autenticación requerida para todas las operaciones

### Interfaz
- Diseño responsive con Material UI
- AppBar con información del usuario
- Selectores de mes/año
- Tablas agrupadas por categoría
- Totales automáticos por categoría y generales
- Modales para agregar/editar gastos

## Configuración Necesaria

### Variables de Entorno (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=           # Opcional - para Google Analytics
```

### Path Aliases Configurados
El proyecto usa path aliases para imports más limpios:
```typescript
// En lugar de: import { auth } from '../../../firebase'
import { auth } from '@/lib/firebase'

// Configurado en:
// - tsconfig.app.json: baseUrl y paths
// - vite.config.ts: resolve.alias
```

### Firebase Console
1. Crear proyecto en Firebase
2. Activar Google Authentication
3. Crear Firestore Database
4. Obtener credenciales de configuración

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (http://localhost:5173)
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Ejecutar linter
firebase deploy      # Deploy a Firebase Hosting
```

## Flujo de la Aplicación

1. **Inicio**: Usuario ve pantalla de Login
2. **Autenticación**: Click en "Iniciar sesión con Google"
3. **Dashboard**: Tras login exitoso, ve el panel principal
4. **Filtrado**: Selecciona mes y año
5. **Visualización**: Ve sus gastos organizados por categoría
6. **CRUD**:
   - Agregar: Click en "Nuevo Gasto" → Modal → Guardar
   - Editar: Click en ícono de editar → Modal con datos → Modificar → Guardar
   - Eliminar: Click en ícono de eliminar → Confirmar
7. **Totales**: Se calculan automáticamente por categoría y total general
8. **Logout**: Click en botón de cerrar sesión

## Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null &&
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                      request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Estado Actual del Proyecto

### Completado
- ✅ Estructura básica del proyecto
- ✅ Configuración de Firebase
- ✅ Autenticación con Google
- ✅ CRUD de gastos
- ✅ Filtrado por mes/año
- ✅ Categorización
- ✅ Multi-moneda
- ✅ Totales automáticos
- ✅ Interfaz responsiva
- ✅ Seguridad y aislamiento de datos
- ✅ **Arquitectura escalable con separación de concerns**
- ✅ **Path aliases (@/) configurados**
- ✅ **Constantes y utilidades centralizadas**
- ✅ **Componentes organizados por feature**
- ✅ **Firebase modularizado (config, auth, firestore)**

### Próximas Mejoras Sugeridas
- [ ] Exportar datos a Excel
- [ ] Gráficos y reportes
- [ ] Notificaciones de vencimientos
- [ ] Categorías personalizables por usuario
- [ ] Temas personalizados (dark mode)
- [ ] Compartir gastos entre usuarios
- [ ] Historial de cambios
- [ ] Búsqueda de gastos

## Cómo Agregar Nuevas Categorías

El sistema ahora usa **categorías dinámicas**. Las categorías se calculan automáticamente basadas en los gastos existentes, por lo que solo necesitas actualizar 2 archivos:

### Paso 1: Actualizar `src/types/expense.types.ts`
```typescript
export type Category =
  | 'IMPUESTOS_SERVICIOS'
  | 'SERVICIOS_TARJETAS'
  | 'FORD_KA'
  | 'NUEVA_CATEGORIA';  // ← Agregar la nueva categoría aquí
```

### Paso 2: Actualizar `src/utils/constants.ts`
```typescript
// 1. Agregar a la lista de categorías
export const CATEGORIES: readonly Category[] = [
  'IMPUESTOS_SERVICIOS',
  'SERVICIOS_TARJETAS',
  'FORD_KA',
  'NUEVA_CATEGORIA',  // ← Agregar aquí
] as const;

// 2. Agregar el label visible
export const CATEGORY_LABELS: Record<Category, string> = {
  IMPUESTOS_SERVICIOS: 'Impuestos, Servicios e Inversiones',
  SERVICIOS_TARJETAS: 'Servicios y Tarjetas',
  FORD_KA: 'Ford Ka + SEL AT',
  NUEVA_CATEGORIA: 'Nombre Visible de la Categoría',  // ← Agregar aquí
};
```

**¡Eso es todo!** Los gráficos y tablas se actualizan automáticamente.

## Notas para Claude

### Arquitectura y Organización:
1. **Path Aliases**: Siempre usa `@/` para imports desde `src/`
   - `@/lib/firebase` en lugar de rutas relativas
   - `@/types` para todos los tipos
   - `@/utils` para constantes y helpers
   - `@/components/[feature]/` para componentes

2. **Separación de Responsabilidades**:
   - `lib/firebase/`: Solo configuración de Firebase (config, auth, firestore)
   - `types/`: Solo definiciones de tipos TypeScript
   - `utils/`: Solo constantes y funciones puras (sin dependencias de React/Firebase)
   - `hooks/`: Lógica reutilizable con estado
   - `contexts/`: Estado global de la aplicación
   - `components/`: Solo UI y lógica de presentación

3. **Convenciones de Código**:
   - TypeScript **estricto** - todos los tipos deben estar definidos
   - **Type imports**: Usar `import type { X } from '@/types'` cuando solo se importen tipos
   - **Constantes**: Definir en `utils/constants.ts` en lugar de hardcodear valores
   - **Nombres en español** para el dominio del negocio (item, vto, fechaPago, etc.)

4. **Material UI v7**:
   - Usar `Box` y `Stack` en lugar de `Grid` para layouts
   - No agregar otras librerías CSS - solo MUI
   - Los colores de Chip deben ser: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"

5. **Firebase y Seguridad**:
   - **NUNCA** modificar `lib/firebase/config.ts` sin verificar `.env`
   - **SIEMPRE** incluir `userId` en queries y writes de Firestore
   - Los **estados de autenticación** se manejan solo en `AuthContext`
   - El hook `useExpenses` centraliza toda la lógica de CRUD

### Comandos útiles para desarrollo:
```bash
# Verificar estado de Firebase
firebase projects:list

# Verificar reglas de Firestore
firebase deploy --only firestore:rules

# Ver logs de la aplicación
firebase emulators:start --only firestore

# Limpiar build
rm -rf dist node_modules && npm install
```

### Debugging común:
- **Login falla**: Verificar que Google Auth esté habilitado en Firebase Console
- **No se ven datos**: Verificar reglas de Firestore y userId
- **Build falla**: Verificar que .env tenga todas las variables
- **Tipos incorrectos**: Revisar `src/types.ts`
