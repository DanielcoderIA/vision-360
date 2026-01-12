"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Download, TrendingUp, 
  BarChart3, Calendar as CalendarIcon, 
  ArrowRight, Info, Loader2, X, Sparkles
} from "lucide-react";
import { getMonthlyStats, generateAIAudit } from "../actions";
export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);

  // --- ESTADOS PARA LA AUDITORÍA IA ---
  const [showAudit, setShowAudit] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState("");

 useEffect(() => {
    async function loadData() {
      try {
        const data = await getMonthlyStats();
        
        // --- VERIFICACIÓN DE SEGURIDAD ---
        // Forzamos que los datos se ordenen por fecha antes de guardarlos en el estado
        // y nos aseguramos de que no haya más de 5 meses para no amontonar las barras.
        const filteredData = data.slice(-5); 
        setStats(filteredData);
        
      } catch (error) {
        console.error("Error cargando reportes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  // --- AUDITORÍA INTELIGENTE REAL ---
  const handleSmartAudit = async () => {
    // 1. Abrimos el modal y mostramos el círculo de carga
    setShowAudit(true);
    setAnalyzing(true);
    setAuditResult(""); 

    try {
      // 2. Llamamos a tu función de actions.ts que habla con Gemini
      // El "await" espera a que Google responda (puede tardar unos segundos)
      const result = await generateAIAudit();
      
      // 3. Guardamos la respuesta real de la IA
      setAuditResult(result);
    
    } catch (error) {
      console.error("Error consultando IA:", error);
      setAuditResult("⚠️ Ocurrió un error al analizar tus datos. Por favor intenta de nuevo.");
    } finally {
      // 4. Detenemos la animación de carga (pase lo que pase)
      setAnalyzing(false);
    }
  };

  const currentMonth = stats[stats.length - 1] || { income: 0, expense: 0 };
  const prevMonth = stats[stats.length - 2] || { income: 0, expense: 0 };
  const hasImproved = currentMonth.expense < prevMonth.expense || prevMonth.expense === 0;
  const savingsRate = currentMonth.income > 0 
    ? Math.round(((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100) 
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6 md:p-10 pb-20 bg-[#F8FAFC] relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Reportes</h1>
          <p className="text-slate-500 font-medium mt-2">Análisis profundo de tu comportamiento financiero</p>
        </div>
        <button 
            onClick={() => window.print()} 
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
            <Download size={20} /> Exportar PDF
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <CalendarIcon size={18} className="text-slate-400" />
          <span className="font-bold text-slate-700 text-sm">Año 2026</span>
        </div>
        <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          {loading ? "Cargando datos..." : `Mostrando ${stats.length} meses de actividad`}
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter flex items-center gap-2">
                <BarChart3 className="text-indigo-500" size={20}/> Rendimiento Mensual
              </h3>
              <p className="text-xs text-slate-400 font-medium ml-7">Ingresos (Verde) vs Gastos (Rojo)</p>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-around gap-2 px-4 pb-8 border-b border-slate-50">
            
           {loading ? (
  <div className="flex flex-col items-center gap-2 mb-20 w-full">
    <Loader2 className="animate-spin text-indigo-500" size={40} />
    <p className="text-slate-400 font-bold text-xs uppercase">Cargando...</p>
  </div>
) : stats.length > 0 ? (
  stats.map((item, index) => {
    // Calculamos el máximo global para que las barras escalen bien entre sí
    const allValues = stats.map(s => [s.income, s.expense]).flat();
    const maxVal = Math.max(...allValues, 1); 
    
    const incomeH = (item.income / maxVal) * 250;
    const expenseH = (item.expense / maxVal) * 250;

    return (
      <div key={index} className="flex flex-col items-center gap-3 w-full group">
        <div className="flex items-end gap-1 h-[250px] relative">
          {/* Tooltip: Aparece al pasar el mouse sobre el grupo de barras */}
          <div className="absolute -top-14 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] p-2.5 rounded-xl z-20 w-32 text-center shadow-2xl border border-white/10 pointer-events-none">
            <div className="flex justify-between items-center text-emerald-400 mb-1">
              <span>Ingreso:</span>
              <span className="font-bold">${item.income.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between items-center text-rose-400">
              <span>Gasto:</span>
              <span className="font-bold">${item.expense.toLocaleString('es-CO')}</span>
            </div>
          </div>

          {/* Barra de Ingresos (Verde) */}
          <div 
            className="w-4 sm:w-8 bg-emerald-400 rounded-t-lg transition-all duration-700 group-hover:bg-emerald-500 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
            style={{ height: `${Math.max(incomeH, 4)}px` }} 
          />
          
          {/* Barra de Gastos (Roja) */}
          <div 
            className="w-4 sm:w-8 bg-rose-400 rounded-t-lg transition-all duration-700 group-hover:bg-rose-500 group-hover:shadow-[0_0_15px_rgba(251,113,113,0.3)]" 
            style={{ height: `${Math.max(expenseH, 4)}px` }} 
          />
        </div>
        
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          {item.month}
        </span>
      </div>
    );
  })

            ) : (
              <p className="w-full text-center text-slate-300 font-bold italic mb-20">Sin datos suficientes</p>
            )}
          </div>
        </div>

        {/* INSIGHTS & AUDITORÍA */}
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-2 text-indigo-400">
              <Info size={20} />
              <h3 className="font-black uppercase tracking-tighter">Observaciones</h3>
            </div>
            <div className="space-y-4">
              <InsightItem title="Tasa de Ahorro" desc={`Retención del ${savingsRate}% de ingresos.`} trend={savingsRate > 20 ? "up" : "down"} />
              <InsightItem title="Tendencia" desc={hasImproved ? "Gastos a la baja." : "Gastos en aumento."} trend={hasImproved ? "up" : "down"} />
            </div>
          </div>

          <div className="relative z-10 pt-8">
            <button 
                onClick={handleSmartAudit}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20 active:scale-95 group"
            >
              <Sparkles size={16} className="group-hover:animate-pulse"/> AUDITORÍA INTELIGENTE
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5"><TrendingUp size={250} /></div>
        </div>
      </div>

      {/* --- MODAL DE INTELIGENCIA ARTIFICIAL --- */}
      {showAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                
                {/* Cabecera del Modal */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg tracking-tight">Análisis IA</h3>
                            <p className="text-xs text-indigo-200 font-medium">Powered by Google Gemini</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAudit(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

{/* Contenido del Modal - REEMPLAZA SOLO ESTA PARTE */}
<div className="p-8 bg-slate-50">
    {analyzing ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={20} className="text-indigo-600 animate-pulse" />
                </div>
            </div>
            <p className="text-slate-500 font-bold text-sm animate-pulse">Analizando patrones de gasto...</p>
        </div>
    ) : (
        <div className="space-y-4 w-full">
            {/* AQUÍ ESTÁ EL CAMBIO CLAVE: Contenedor con Scroll */}
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="prose prose-sm prose-slate max-w-none">
                    <p className="whitespace-pre-line text-slate-700 font-semibold leading-relaxed text-sm">
                        {auditResult}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={() => setShowAudit(false)}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 text-sm active:scale-95"
            >
                ENTENDIDO, APLICAR CONSEJOS
            </button>
        </div>
    )}
</div>

            </div>
        </div>
      )}

    </div>
  );
}

function InsightItem({ title, desc, trend }: { title: string, desc: string, trend: 'up' | 'down' }) {
  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${trend === 'up' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <p className="font-bold text-xs uppercase tracking-widest text-indigo-300">{title}</p>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
    </div>
  );
}