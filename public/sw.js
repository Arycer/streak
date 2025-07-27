const CACHE_NAME = 'streak-v1.0.0';
const STATIC_CACHE = 'streak-static-v1';
const DYNAMIC_CACHE = 'streak-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Clone the request for caching
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  // Handle background sync events here
});

// Push notifications - Handle task reminders
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  
  let notificationData = {
    title: '¡Hora de tu hábito!',
    body: 'Es momento de completar una de tus tareas',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'task-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'complete',
        title: '✅ Completar',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'snooze',
        title: '⏰ Recordar en 10min',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: '❌ Descartar',
        icon: '/icons/icon-72x72.png'
      }
    ],
    data: {
      url: '/today',
      taskId: null,
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      
      switch (action) {
        case 'complete':
          // Mark task as complete
          if (data.taskId) {
            // Send message to client to complete task
            if (clients.length > 0) {
              clients[0].postMessage({
                type: 'COMPLETE_TASK',
                taskId: data.taskId
              });
              clients[0].focus();
            } else {
              // Open app to complete task
              await self.clients.openWindow(`${data.url}?complete=${data.taskId}`);
            }
          }
          break;
          
        case 'snooze':
          // Schedule another notification in 10 minutes
          console.log('Snoozing notification for 10 minutes');
          setTimeout(() => {
            self.registration.showNotification(
              `🔔 Recordatorio: ${event.notification.title}`,
              {
                ...event.notification,
                body: `Recordatorio pospuesto: ${event.notification.body}`,
                tag: `${event.notification.tag}-snooze`,
                timestamp: Date.now()
              }
            );
          }, 10 * 60 * 1000); // 10 minutes
          break;
          
        case 'dismiss':
          // Just close, no action needed
          console.log('Notification dismissed');
          break;
          
        default:
          // Default click - open the app
          if (clients.length > 0) {
            clients[0].focus();
          } else {
            await self.clients.openWindow(data.url || '/');
          }
          break;
      }
    })()
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  // Track notification dismissal if needed
});
