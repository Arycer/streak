import { supabase } from "@/lib/supabaseClient";

// VAPID keys - Configuradas para notificaciones push
const VAPID_PUBLIC_KEY =
  "BBn69f00CGmVE5BimYYIyPI4YQG0ohFNyMuCGf8k6waZdDXapm8mPc1P8jfV8YKS1OixHh0FGSLFrfEppHfXGF0";

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }

    return PushNotificationService.instance;
  }

  // Solicitar permisos de notificación
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Este navegador no soporta notificaciones");

      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("Este navegador no soporta service workers");

      return false;
    }

    const permission = await Notification.requestPermission();

    return permission === "granted";
  }

  // Obtener o crear push subscription
  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Verificar si ya existe una subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Crear nueva subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey("p256dh")
            ? btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("p256dh")!),
                ),
              )
            : "",
          auth: subscription.getKey("auth")
            ? btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("auth")!),
                ),
              )
            : "",
        },
      };

      // Guardar subscription en Supabase
      await this.saveSubscriptionToDatabase(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error("Error al suscribirse a push notifications:", error);

      return null;
    }
  }

  // Guardar subscription en la base de datos
  private async saveSubscriptionToDatabase(
    subscription: PushSubscription,
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      console.log("Push subscription guardada exitosamente");
    } catch (error) {
      console.error("Error al guardar push subscription:", error);
    }
  }

  // Desuscribirse de push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromDatabase();

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error al desuscribirse:", error);

      return false;
    }
  }

  // Remover subscription de la base de datos
  private async removeSubscriptionFromDatabase(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error al remover push subscription:", error);
    }
  }

  // Verificar si las notificaciones están habilitadas
  isNotificationSupported(): boolean {
    return "Notification" in window && "serviceWorker" in navigator;
  }

  // Verificar estado de permisos
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Utility function para convertir VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Programar notificación local (fallback)
  scheduleLocalNotification(title: string, body: string, delay: number): void {
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          tag: "task-reminder",
          requireInteraction: true,
        });
      }
    }, delay);
  }
}
