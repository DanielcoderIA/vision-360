"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { 
  Save, 
  User, 
  CreditCard, 
  ShieldAlert, 
  Download, 
  LogOut,
  Loader2
} from "lucide-react";

export default function ConfiguracionPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // Estado del formulario
  const [presupuesto, setPresupuesto] = useState("");
  const [moneda, setMoneda] = useState("COP");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        cargarConfiguracion(user.id);
      }
    };
    getUser();
  }, [supabase]);

  const cargarConfiguracion = async (userId: string) => {
    const { data } = await supabase
      .from('user_settings')
      .select('monthly_budget')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setPresupuesto(data.monthly_budget.toString());
    }
  };

  const guardarCambios = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Upsert: Crea si no existe, actualiza si existe
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          monthly_budget: parseFloat(presupuesto) || 0,
          currency: moneda 
        });

      if (!error) {
        alert("¡Configuración guardada exitosamente!");
      } else {
        console.error(error);
        alert("Error al guardar. ¿Ya creaste la tabla en Supabase?");
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 text-sm">Administra tus preferencias y límites financieros.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Navegación Visual */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <User size={32} />
            </div>
            <h3 className="font-bold text-slate-800 truncate w-full" title={userEmail}>
              {userEmail || "Usuario"}
            </h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Cuenta Pro</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors font-medium text-sm"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>

        {/* Columna Derecha: Formularios */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tarjeta de Presupuesto */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <CreditCard className="text-blue-500" size={20} /> Metas Financieras
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Límite de Presupuesto Mensual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    value={presupuesto}
                    onChange={(e) => setPresupuesto(e.target.value)}
                    placeholder="Ej: 2000000"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Si tus gastos superan este monto, el semáforo del Dashboard se pondrá en rojo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Moneda Principal
                </label>
                <select 
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={guardarCambios}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar Configuración
              </button>
            </div>
          </div>

          {/* Tarjeta de Zona de Datos (Futuro) */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm opacity-60">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <ShieldAlert className="text-amber-500" size={20} /> Zona de Datos
            </h3>
            <div className="flex gap-4">
              <button disabled className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-400 text-sm font-medium flex justify-center items-center gap-2 cursor-not-allowed">
                <Download size={16} /> Exportar Excel
              </button>
            </div>
            <p className="text-xs text-center text-slate-400 mt-3 italic">Próximamente disponible</p>
          </div>

        </div>
      </div>
    </div>
  );
}