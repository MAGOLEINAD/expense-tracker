# 📋 Instrucciones para Migrar Datos de Diciembre 2025

## ⚠️ IMPORTANTE: Obtener tu User ID primero

Antes de ejecutar la migración, necesitas obtener tu `userId` real de Firebase Auth.

### Pasos:

1. **Inicia sesión en la app**: https://gastos-mensuales-leinad.web.app

2. **Abre la consola del navegador** (F12)

3. **Ejecuta este código en la consola**:
   ```javascript
   firebase.auth().currentUser.uid
   ```

4. **Copia el UID** que aparece (algo como: `xYz123AbC456...`)

5. **Edita el archivo `migrate-december.ts`** y reemplaza en la línea 20:
   ```typescript
   const USER_ID = "PEGA_AQUI_TU_UID_REAL";
   ```

---

## 🚀 Ejecutar la Migración

### Opción 1: Desde Firebase Console (Recomendado)

1. Ve a [Firestore Database](https://console.firebase.google.com/project/gastos-mensuales-leinad/firestore)
2. Click en "Start collection"
3. Collection ID: `expenses`
4. Agregar los documentos manualmente uno por uno desde el script

### Opción 2: Usar el Script (Requiere Node.js)

```bash
# Instalar ts-node si no lo tienes
npm install -g ts-node

# Ejecutar el script
ts-node migrate-december.ts
```

---

## ✅ Verificación

Después de migrar:
1. Recarga la app
2. Selecciona "Diciembre 2025"
3. Deberías ver las 3 categorías con sus gastos

---

## 📊 Datos que se migrarán:

- **IMPUESTOS, SERVICIOS E INVERSIONES**: 6 gastos
- **SERVICIOS Y TARJETAS**: 3 gastos
- **FORD KA**: 6 gastos (todos con importe $0)

**Total**: 15 gastos para diciembre 2025
