export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Streak",
  description:
    "App open-source que te permite registrar y seguir tus hábitos diarios, ayudándote a mantenerte motivado y enfocado en tus objetivos.",
  navItems: [
    {
      label: "Inicio",
      href: "/",
    },
    {
      label: "Resumen",
      href: "/summary",
    },
    {
      label: "Hoy",
      href: "/today",
    },
    {
      label: "Semana",
      href: "/week",
    },
    {
      label: "Notas",
      href: "/notes",
    },
  ],
  navMenuItems: [
    {
      label: "Inicio",
      href: "/",
    },
    {
      label: "Resumen",
      href: "/summary",
    },
    {
      label: "Hoy",
      href: "/today",
    },
    {
      label: "Semana",
      href: "/week",
    },
    {
      label: "Notas",
      href: "/notes",
    },
  ],
  links: {
    github: "https://github.com/Arycer/Streak",
  },
};
