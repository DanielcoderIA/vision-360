"use client";

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";

export default function Sidebar() {
  // 1. Estados iniciales: El cliente de Supabase se inicia en nulo para evitar errores de SSR
  const [supabase, setSupabase] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  // 2. Efecto de hidratación: Solo se ejecuta en el navegador del cliente
  useEffect(() => {
    const client = createClient();
    setSupabase(client);

    const fetchUser = async () => {
      const { data: { user } } = await client.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  // 3. Manejo de cierre de sesión profesional
  const handleLogout = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/" },
    { icon: <Receipt size={20} />, label: "Movimientos", href: "/movimientos" },
    { icon: <BarChart3 size={20} />, label: "Reportes", href: "/reportes" },
  ];

  // 4. Renderizado de seguridad: Mientras se carga el cliente, mostramos un esqueleto básico
  if (!supabase) {
    return <aside className="w-64 bg-white border-r h-full fixed animate-pulse" />;
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50">
      {/* Branding */}
      <div className="p-6 flex items-center gap-3 text-blue-600">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">V</div>
        <span className="font-bold text-xl tracking-tight text-slate-800 uppercase">Visión 360</span>
      </div>
      
      {/* Menú Principal */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Menú Principal</p>
        
        {menuItems.map((item) => (
          <Link 
            key={item.label} 
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              pathname === item.href 
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm shadow-blue-50' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
        
        <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8 mb-4">Ajustes</p>
        
        <Link 
          href="/configuracion" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname === "/configuracion" ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Settings size={20} />
          <span className="text-sm">Configuración</span>
        </Link>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl mt-4 transition-colors group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </nav>

      {/* Perfil del Usuario */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
            {userEmail ? userEmail.substring(0, 2).toUpperCase() : <User size={16}/>}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">Mi Pyme S.A.S</p>
            <p className="text-[10px] text-slate-500 truncate lowercase">{userEmail || 'Conectando...'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}