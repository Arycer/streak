import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";

import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons";
import { Logo } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <HeroUINavbar
      className="backdrop-blur-md bg-gradient-to-r from-purple-100/90 to-pink-100/90 supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-purple-100/90 supports-[backdrop-filter]:to-pink-100/90 z-50 border-b border-purple-300/60 shadow-lg"
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <Logo />
            <p className="font-bold text-inherit">Streak</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
        </NavbarItem>
        
        {/* Authentication Section */}
        <NavbarItem className="hidden md:flex">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
          ) : user ? (
            <Dropdown>
              <DropdownTrigger>
                <Avatar
                  as="button"
                  className="transition-transform"
                  size="sm"
                  src={user.user_metadata?.avatar_url}
                  name={user.email?.charAt(0).toUpperCase()}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Conectado como</p>
                  <p className="font-semibold">{user.email}</p>
                </DropdownItem>
                <DropdownItem key="settings">Configuración</DropdownItem>
                <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                  Cerrar Sesión
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex gap-2">
              <Button
                as={Link}
                color="primary"
                href="/login"
                variant="flat"
                size="sm"
              >
                Iniciar Sesión
              </Button>
              <Button
                as={Link}
                color="primary"
                href="/register"
                variant="solid"
                size="sm"
              >
                Registrarse
              </Button>
            </div>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>

        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link color="foreground" href="#" size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          
          {/* Mobile Auth Section */}
          <div className="mt-4 pt-4 border-t border-default-200">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
            ) : user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar
                    size="sm"
                    src={user.user_metadata?.avatar_url}
                    name={user.email?.charAt(0).toUpperCase()}
                  />
                  <div>
                    <p className="text-sm font-semibold">Conectado como</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full"
                >
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  as={Link}
                  color="primary"
                  href="/login"
                  variant="flat"
                  size="sm"
                  className="w-full"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  as={Link}
                  color="primary"
                  href="/register"
                  variant="solid"
                  size="sm"
                  className="w-full"
                >
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
