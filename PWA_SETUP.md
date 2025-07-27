# PWA Setup Instructions

## Configuración Completada ✅

La aplicación Streak ahora está configurada como una Progressive Web App (PWA) compatible con iPhone y otros dispositivos móviles.

### Archivos Creados/Modificados:

1. **`public/manifest.json`** - Manifest de la PWA con configuración completa
2. **`public/sw.js`** - Service Worker mejorado con cache estratégico
3. **`index.html`** - Meta tags PWA y específicas para iOS
4. **`src/main.tsx`** - Registro del Service Worker
5. **`src/components/PWAInstallPrompt.tsx`** - Componente para prompt de instalación
6. **`src/layouts/default.tsx`** - Integración del prompt de instalación

### Características PWA Implementadas:

- ✅ **Instalable**: Los usuarios pueden instalar la app en su pantalla de inicio
- ✅ **Offline**: Funciona sin conexión gracias al Service Worker
- ✅ **Responsive**: Diseño adaptativo para todos los dispositivos
- ✅ **iOS Compatible**: Meta tags específicas para Safari/iPhone
- ✅ **Prompt de Instalación**: Guía automática para instalar la app
- ✅ **Cache Inteligente**: Estrategia de cache para mejor rendimiento

## Pasos Pendientes para Completar:

### 1. Generar Iconos PWA

Necesitas crear los iconos en diferentes tamaños. Puedes usar el archivo `public/icons/icon.svg` como base:

**Tamaños requeridos:**
- 72x72px → `public/icons/icon-72x72.png`
- 96x96px → `public/icons/icon-96x96.png`
- 128x128px → `public/icons/icon-128x128.png`
- 144x144px → `public/icons/icon-144x144.png`
- 152x152px → `public/icons/icon-152x152.png`
- 192x192px → `public/icons/icon-192x192.png`
- 384x384px → `public/icons/icon-384x384.png`
- 512x512px → `public/icons/icon-512x512.png`
- 180x180px → `public/icons/apple-touch-icon.png`

**Herramientas recomendadas:**
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- [Favicon.io](https://favicon.io/favicon-converter/)
- Photoshop/GIMP/Figma

### 2. Probar en iPhone

1. Abre Safari en iPhone
2. Navega a tu aplicación
3. Toca el botón de compartir (📤)
4. Selecciona "Añadir a pantalla de inicio"
5. La app debería instalarse como una aplicación nativa

### 3. Validar PWA

Usa estas herramientas para validar:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Chrome DevTools)
- [PWA Builder](https://www.pwabuilder.com/)

## Configuración Avanzada (Opcional):

### Push Notifications
El Service Worker ya está preparado para push notifications. Para habilitarlas:

1. Configura Firebase Cloud Messaging o similar
2. Agrega la lógica en el event listener `push` del SW
3. Solicita permisos de notificación en la app

### Background Sync
Para sincronización en segundo plano:

1. Registra tareas de sync cuando esté offline
2. Maneja el evento `sync` en el Service Worker
3. Sincroniza datos cuando vuelva la conexión

## Verificación de Funcionamiento:

1. **Instalación**: ¿Aparece el prompt de instalación?
2. **Offline**: ¿Funciona sin internet?
3. **Cache**: ¿Carga rápido en visitas posteriores?
4. **iOS**: ¿Se ve bien en iPhone/Safari?
5. **Standalone**: ¿Se ejecuta como app nativa?

## Troubleshooting:

- **No aparece prompt de instalación**: Verifica que todos los iconos existan
- **Service Worker no se registra**: Revisa la consola del navegador
- **No funciona offline**: Verifica que el SW esté activo en DevTools
- **Iconos no se ven**: Asegúrate de que las rutas en manifest.json sean correctas

¡Tu app Streak ahora está lista para funcionar como una PWA profesional! 🚀
