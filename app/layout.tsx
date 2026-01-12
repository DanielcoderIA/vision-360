"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // 1. Estado para controlar el montaje del componente
  const [mounted, setMounted] = useState(false);

  // 2. Este efecto solo corre en el cliente tras el primer renderizado.
  // Es aquí donde las variables de entorno ya son visibles para el navegador.
  useEffect(() => {
    setMounted(true);
  }, []);

  // 3. Verificamos si es una página de autenticación para no mostrar el menú
  const isAuthPage = pathname === "/login" || pathname?.startsWith("/auth");

  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#F8FAFC] text-slate-900`}>
        <div className="flex min-h-screen">
          
          {/* SOLUCIÓN AL ERROR: 
            Solo renderizamos el Sidebar si el componente ya está 'montado' en el cliente.
            Esto evita que el servidor falle al no encontrar las llaves de Supabase.
          */}
          {mounted && !isAuthPage && <Sidebar />}

          <main 
            className={`flex-1 transition-all duration-300 ${
              mounted && !isAuthPage ? "ml-64" : "ml-0"
            }`}
          >
            <div className={`${isAuthPage ? "" : "p-4 md:p-10"}`}>
              {children}
            </div>
          </main>
          
        </div>
      </body>
    </html>
  );
}