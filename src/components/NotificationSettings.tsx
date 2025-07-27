import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";

import { PushNotificationService } from "@/services/pushNotificationService";

export const NotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const pushService = PushNotificationService.getInstance();

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = () => {
    const supported = pushService.isNotificationSupported();

    setIsSupported(supported);

    if (supported) {
      setPermission(pushService.getPermissionStatus());
      checkSubscriptionStatus();
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const hasPermission = await pushService.requestPermission();

      if (hasPermission) {
        const subscription = await pushService.subscribeToPush();

        if (subscription) {
          setIsSubscribed(true);
          setPermission("granted");
        }
      } else {
        setPermission("denied");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      const success = await pushService.unsubscribeFromPush();

      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error disabling notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = () => {
    if (permission === "granted") {
      pushService.scheduleLocalNotification(
        "🎯 Prueba de notificación",
        "Esta es una notificación de prueba para verificar que funciona correctamente",
        1000, // 1 segundo
      );
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold">Notificaciones Push</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">
              Las notificaciones push no están disponibles en este navegador.
            </p>
            <Chip color="warning" variant="flat">
              No compatible
            </Chip>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notificaciones Push</h3>
        <Chip
          color={
            isSubscribed
              ? "success"
              : permission === "denied"
                ? "danger"
                : "default"
          }
          variant="flat"
        >
          {isSubscribed
            ? "Activas"
            : permission === "denied"
              ? "Bloqueadas"
              : "Inactivas"}
        </Chip>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-gray-600">
          Recibe recordatorios automáticos cuando sea hora de completar tus
          hábitos.
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notificaciones de tareas</p>
            <p className="text-sm text-gray-500">
              Te avisaremos cuando sea hora de hacer tus hábitos
            </p>
          </div>
          <Switch
            isDisabled={loading || permission === "denied"}
            isSelected={isSubscribed}
            onValueChange={
              isSubscribed
                ? handleDisableNotifications
                : handleEnableNotifications
            }
          />
        </div>

        {permission === "denied" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              Las notificaciones están bloqueadas. Para habilitarlas:
            </p>
            <ol className="text-sm text-red-600 mt-1 ml-4 list-decimal">
              <li>
                Haz clic en el ícono de candado en la barra de direcciones
              </li>
              <li>Selecciona "Permitir" para notificaciones</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        )}

        {isSubscribed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700 mb-2">
              ✅ Las notificaciones están activas. Recibirás recordatorios
              automáticos.
            </p>
            <Button
              color="primary"
              size="sm"
              variant="flat"
              onPress={testNotification}
            >
              Probar notificación
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            💡 <strong>Tip:</strong> Para mejor experiencia, instala la app en
            tu pantalla de inicio
          </p>
          <p>
            🔋 Las notificaciones funcionan incluso cuando la app está cerrada
          </p>
          <p>
            ⏰ Los recordatorios se envían automáticamente a la hora programada
          </p>
        </div>
      </CardBody>
    </Card>
  );
};
