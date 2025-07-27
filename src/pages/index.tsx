import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/context/AuthContext";

export default function IndexPage() {
  const { user, loading } = useAuth();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title({})}>
            Trackea tus hábitos y mejora tu motivación
          </span>
          <div className={subtitle({ class: "mt-4" })}>
            {siteConfig.description}
          </div>
        </div>

        <div className="flex gap-3">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-full" />
          ) : user ? (
            <Link
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })}
              href="/summary"
            >
              <span className="text-sm">Ir a Resumen</span>
            </Link>
          ) : (
            <>
              <Link
                className={buttonStyles({
                  color: "primary",
                  radius: "full",
                  variant: "shadow",
                })}
                href="/login"
              >
                <span className="text-sm">Iniciar sesión</span>
              </Link>
              <Link
                className={buttonStyles({
                  color: "default",
                  radius: "full",
                  variant: "bordered",
                })}
                href="/register"
              >
                <span className="text-sm">Registrarse</span>
              </Link>
            </>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}
