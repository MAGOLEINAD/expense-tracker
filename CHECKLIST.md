# ✅ Checklist de Configuración

Usa esta lista para verificar que todo esté configurado correctamente.

---

## 📋 Paso 1: Firebase Console

### Crear proyecto Firebase
- [ ] Ir a https://console.firebase.google.com/
- [ ] Click "Add project"
- [ ] Nombre del proyecto: `_________________`
- [ ] Proyecto creado exitosamente

### Activar Google Authentication
- [ ] Ir a **Authentication** → Sign-in method
- [ ] Habilitar **Google**
- [ ] Guardar email de soporte
- [ ] Estado: **Enabled** ✅

### Crear Firestore Database
- [ ] Ir a **Firestore Database**
- [ ] Click "Create database"
- [ ] Región seleccionada: `_________________`
- [ ] Modo: **Production mode**
- [ ] Base de datos creada ✅

### Obtener credenciales
- [ ] Project Settings (⚙️)
- [ ] Your apps → Web (</>)
- [ ] App registrada
- [ ] Credenciales copiadas ✅

---

## 🔧 Paso 2: Configuración local

### Archivo .env creado
- [ ] Archivo `.env` existe en `/expense-tracker`
- [ ] VITE_FIREBASE_API_KEY configurado
- [ ] VITE_FIREBASE_AUTH_DOMAIN configurado
- [ ] VITE_FIREBASE_PROJECT_ID configurado
- [ ] VITE_FIREBASE_STORAGE_BUCKET configurado
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID configurado
- [ ] VITE_FIREBASE_APP_ID configurado

### Dependencias instaladas
- [ ] Ejecuté: `npm install`
- [ ] Sin errores de instalación
- [ ] `node_modules` existe

---

## 🚀 Paso 3: Primera ejecución

### Servidor de desarrollo
- [ ] Ejecuté: `npm run dev`
- [ ] Servidor inició sin errores
- [ ] URL: http://localhost:5173

### Pantalla de Login
- [ ] Veo la pantalla de login
- [ ] Aparece el botón "Iniciar sesión con Google"
- [ ] No hay errores en consola (F12)

### Login exitoso
- [ ] Click en "Iniciar sesión con Google"
- [ ] Popup de Google apareció
- [ ] Seleccioné mi cuenta
- [ ] Fui redirigido al Dashboard

---

## ✨ Paso 4: Funcionalidad básica

### Dashboard visible
- [ ] Veo el AppBar con mi foto/nombre
- [ ] Selector de mes funciona
- [ ] Selector de año funciona
- [ ] Botón "Nuevo Gasto" visible

### Crear primer gasto
- [ ] Click en "Nuevo Gasto"
- [ ] Modal se abre correctamente
- [ ] Completé todos los campos:
  - Categoría: `_________________`
  - Item: `_________________`
  - Vencimiento: `_________________`
  - Fecha de pago: `_________________`
  - Importe: `_________________`
  - Moneda: ARS / USD
  - Pagado por: `_________________`
  - Estado: `_________________`
- [ ] Click "Guardar"
- [ ] Gasto aparece en la tabla ✅

### Editar gasto
- [ ] Click en ícono de editar (✏️)
- [ ] Modal se abre con datos del gasto
- [ ] Modifico un campo
- [ ] Guardo cambios
- [ ] Cambio se refleja en la tabla ✅

### Eliminar gasto
- [ ] Click en ícono de eliminar (🗑️)
- [ ] Confirmo eliminación
- [ ] Gasto desaparece de la tabla ✅

### Totales
- [ ] Los subtotales por categoría son correctos
- [ ] El total general del mes es correcto
- [ ] Los totales se actualizan al agregar/editar/eliminar

---

## 🔐 Paso 5: Seguridad y multi-usuario

### Test de aislamiento de datos
- [ ] Cierro sesión
- [ ] Inicio sesión con OTRA cuenta de Google
- [ ] NO veo los gastos de la cuenta anterior ✅
- [ ] Puedo crear mis propios gastos
- [ ] Vuelvo a la cuenta original
- [ ] Mis gastos siguen ahí ✅

### Firestore Rules deployadas
- [ ] Ejecuté: `firebase init`
- [ ] Ejecuté: `firebase deploy --only firestore:rules`
- [ ] En Firebase Console → Firestore → Rules
- [ ] Las reglas están activas

---

## 📱 Paso 6: Responsive (opcional)

### Mobile
- [ ] Abro en Chrome DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Selecciono iPhone/Android
- [ ] La app se ve bien en mobile
- [ ] Puedo agregar/editar gastos

---

## 🚀 Paso 7: Deploy (opcional)

### Firebase Hosting
- [ ] Instalé: `npm install -g firebase-tools`
- [ ] Ejecuté: `firebase login`
- [ ] Ejecuté: `firebase init`
  - [ ] Hosting seleccionado
  - [ ] Firestore seleccionado
  - [ ] Public directory: `dist`
  - [ ] Single-page app: Yes
- [ ] Ejecuté: `npm run build`
- [ ] Sin errores de build
- [ ] Ejecuté: `firebase deploy`
- [ ] Deploy exitoso ✅
- [ ] URL de producción: `_______________________________`

### Verificar en producción
- [ ] Abro la URL de producción
- [ ] Login con Google funciona
- [ ] Puedo crear gastos
- [ ] Todo funciona igual que en desarrollo ✅

---

## 🎉 ¡Completado!

### Resumen
- ✅ Firebase configurado
- ✅ App corriendo en desarrollo
- ✅ CRUD de gastos funcional
- ✅ Multi-usuario funcional
- ✅ Datos seguros y aislados
- ✅ (Opcional) Deploy a producción

### Próximos pasos sugeridos
- [ ] Agregar más categorías personalizadas
- [ ] Exportar a Excel
- [ ] Implementar gráficos
- [ ] Agregar notificaciones de vencimientos
- [ ] Personalizar colores y tema

---

**Fecha de completado**: _______________

**Notas**:
```





```
