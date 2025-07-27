import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";

import { supabase } from "@/lib/supabaseClient";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones básicas
    if (!email || !password) {
      setError("Email y contraseña son obligatorios");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Redirigir al dashboard/home después del login exitoso
        navigate("/");
      }
    } catch (err) {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Ingresa tu email para recuperar la contraseña");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setError(""); // Clear any previous errors
        alert("Se ha enviado un email para restablecer tu contraseña");
      }
    } catch (err) {
      setError("Error al enviar email de recuperación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 min-h-[80vh]">
        <div className="inline-block max-w-lg text-center justify-center mb-6">
          <h1 className={title()}>Iniciar Sesión</h1>
          <p className="text-lg text-gray-600 mt-2">
            Accede a tu cuenta de Streak
          </p>
        </div>

        <Card className="max-w-md w-full">
          <CardHeader className="pb-0 pt-6 px-6">
            <h2 className="text-xl font-semibold text-center w-full">Login</h2>
          </CardHeader>
          <CardBody className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Input
                type="email"
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                variant="bordered"
              />

              <Input
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                variant="bordered"
                endContent={
                  <button
                    className="focus:outline-none text-gray-400 hover:text-gray-600"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? "🙈" : "👁️"}
                  </button>
                }
                type={isVisible ? "text" : "password"}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{" "}
                <Link 
                  to="/register" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
