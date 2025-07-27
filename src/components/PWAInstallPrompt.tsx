import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);

    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show install prompt if not in standalone mode
    if (
      isIOSDevice &&
      !window.matchMedia("(display-mode: standalone)").matches
    ) {
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember user dismissed the prompt
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if user previously dismissed or if already installed
  if (
    !showInstallPrompt ||
    localStorage.getItem("pwa-install-dismissed") === "true" ||
    window.matchMedia("(display-mode: standalone)").matches
  ) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 shadow-lg">
      <CardBody className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">¡Instala Streak!</h3>
            <p className="text-xs text-gray-600">
              {isIOS
                ? "Toca el botón de compartir y selecciona 'Añadir a pantalla de inicio'"
                : "Instala la app para una mejor experiencia"}
            </p>
          </div>
          <div className="flex gap-2">
            {!isIOS && deferredPrompt && (
              <Button
                color="primary"
                size="sm"
                variant="solid"
                onPress={handleInstallClick}
              >
                Instalar
              </Button>
            )}
            <Button
              color="default"
              size="sm"
              variant="light"
              onPress={handleDismiss}
            >
              ✕
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
