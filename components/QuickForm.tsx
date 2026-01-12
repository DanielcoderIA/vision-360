'use client';

import { useState } from 'react';
import { addTransaction } from '@/app/actions';
import { X, Plus, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickForm({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    // Obtenemos los datos directamente del formulario sin filtros manuales
    const formData = new FormData(e.currentTarget);
    
    try {
      // Forzamos el envío al servidor
      const result = await addTransaction(formData);
      
      if (result?.error) {
        // Si el servidor detecta que la sesión expiró, el mensaje vendrá de actions.ts
        alert(result.error);
        if (result.error.includes("sesión")) {
          router.push('/login');
        }
      } else {
        // ÉXITO: Cerramos y forzamos recarga total de la URL para limpiar caché
        onClose();
        window.location.href = '/'; 
      }
    } catch (err) {
      console.error("Error detectado en el cliente:", err);
      alert("Hubo un problema de red. Revisa la terminal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Nueva Transacción</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="income" defaultChecked className="sr-only peer" />
                <div className="text-center py-2.5 text-sm font-black rounded-xl peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm text-slate-500 transition-all uppercase tracking-wider">
                  Ingreso
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="expense" className="sr-only peer" />
                <div className="text-center py-2.5 text-sm font-black rounded-xl peer-checked:bg-white peer-checked:text-rose-600 peer-checked:shadow-sm text-slate-500 transition-all uppercase tracking-wider">
                  Gasto
                </div>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Descripción</label>
              <input 
                name="description" 
                required 
                placeholder="Ej: Pago de Nómina" 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-medium placeholder:text-slate-300 focus:bg-white focus:border-blue-500 outline-none transition-all" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Categoría</label>
              <div className="relative">
                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select 
                  name="category" 
                  required 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-medium appearance-none focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Ventas">Ventas de Producto</option>
                  <option value="Servicios">Ventas de Servicio</option>
                  <option value="Nomina">Nómina y Salarios</option>
                  <option value="Suministros">Suministros</option>
                  <option value="Marketing">Marketing y Publicidad</option>
                  <option value="Inversion">Inversión</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Monto (COP)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">$</span>
                <input 
                  name="amount" 
                  type="number"
                  step="0.01" 
                  required 
                  placeholder="0" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-10 pr-5 py-4 text-slate-800 font-black text-xl placeholder:text-slate-300 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center gap-2">Guardando...</span>
              ) : (
                <>
                  <Plus size={22} strokeWidth={3} />
                  <span className="uppercase tracking-widest">Registrar Movimiento</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}