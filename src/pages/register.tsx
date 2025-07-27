import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";

import { supabase } from "@/lib/supabaseClient";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones básicas
    if (!email || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.");
        // Opcional: redirigir después de un tiempo
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 min-h-[80vh]">
        <div className="inline-block max-w-lg text-center justify-center mb-6">
          <h1 className={title()}>Crear Cuenta</h1>
          <p className="text-lg text-gray-600 mt-2">
            Únete a Streak para gestionar tus tareas diarias
          </p>
        </div>

        <Card className="max-w-md w-full">
          <CardHeader className="pb-0 pt-6 px-6">
            <h2 className="text-xl font-semibold text-center w-full">Registro</h2>
          </CardHeader>
          <CardBody className="p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {success}
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

              <Input
                label="Confirmar Contraseña"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isRequired
                variant="bordered"
                endContent={
                  <button
                    className="focus:outline-none text-gray-400 hover:text-gray-600"
                    type="button"
                    onClick={toggleConfirmVisibility}
                  >
                    {isConfirmVisible ? "🙈" : "👁️"}
                  </button>
                }
                type={isConfirmVisible ? "text" : "password"}
              />

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{" "}
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
