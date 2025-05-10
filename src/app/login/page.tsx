"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); // Cambia a "/dashboard" si tu dashboard está en esa ruta
    }
  }, [status, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <Button onClick={() => signIn("google", { callbackUrl: "/" })}>
        Iniciar sesión con Google
      </Button>
    </div>
  );
} 