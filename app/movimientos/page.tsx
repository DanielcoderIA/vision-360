"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  // 1. Función para cargar datos de la base de datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log("Iniciando carga de movimientos...");

      const { data, error } = await supabase
        .from("transactions") 
        .select("*")
        // Ordenamos por fecha de transacción y luego por hora de creación (Doble orden)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error de Supabase:", error.message);
        setMovimientos([]);
      } else {
        console.log("Datos recibidos:", data?.length, "registros");
        setMovimientos(data || []);
      }
    } catch (err) {
      console.error("Error inesperado en el cliente:", err);
      setMovimientos([]);
    } finally {
      // Esto asegura que el mensaje "Cargando..." desaparezca
      setLoading(false);
    }
  };

  // 2. useEffect: El disparador que ejecuta la carga al entrar a la página
  // Ahora está fuera de la función cargarDatos para que funcione correctamente
  useEffect(() => {
    cargarDatos();
  }, []);

  // 3. Función para borrar registros
  const borrarRegistro = async (id: string) => {
    const confirmar = confirm("¿Estás seguro de que quieres eliminar este registro?");
    if (confirmar) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (!error) {
        // Actualizamos la lista visualmente
        setMovimientos(movimientos.filter((m) => m.id !== id));
      } else {
        alert("Hubo un error al intentar borrar el registro.");
      }
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 animate-pulse font-medium">Cargando movimientos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial de Finanzas</h1>
          <p className="text-slate-500 text-sm">Consulta y administra tus ingresos y gastos.</p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No hay movimientos registrados.</td>
                </tr>
              ) : (
                movimientos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(item.transaction_date), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 text-sm">
                      {item.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {item.type === 'income' ? <ArrowUpCircle size={14}/> : <ArrowDownCircle size={14}/>}
                        ${Number(item.amount).toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => borrarRegistro(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Eliminar movimiento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}