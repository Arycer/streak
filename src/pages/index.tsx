import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
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
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href="/login"
          >
            <span className="text-sm">Iniciar sesión</span>
          </Link>
        </div>
      </section>
    </DefaultLayout>
  );
}
