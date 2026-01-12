"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getFinancialSummary, getChartData, getRecentTransactions, 
  deleteTransaction, getCategoryData, getUserBudget 
} from "./actions";
import TrendChart from "@/components/TrendChart";
import CategoryChart from "@/components/CategoryChart";
import QuickForm from "@/components/QuickForm";
import { 
  TrendingUp, TrendingDown, Wallet, Plus, 
  Calendar, ChevronDown, Trash2, Target,
  ArrowUpRight, ArrowDownLeft, Receipt,
  Activity, PieChart
} from "lucide-react";

// Skeleton solo para la carga inicial (más redondeado para encajar con el diseño)
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-[2rem] ${className}`} />
);

export default function Home() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30); 
  
  // Estado inicial
  const [data, setData] = useState({
    summary: { totalIncome: 0, totalExpense: 0, balance: 0 },
    chartData: [] as any[],
    categoryData: [] as any[],
    recent: [] as any[],
    budget: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, r, cat, b] = await Promise.all([
        getFinancialSummary(days),
        getChartData(days),
        getRecentTransactions(),
        getCategoryData(days),
        getUserBudget()
      ]);
      setData({ summary: s, chartData: c, recent: r, categoryData: cat, budget: Number(b) });
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  const fmt = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const execution = data.budget > 0 ? (data.summary.totalExpense / data.budget) * 100 : 0;

  // --- LÓGICA MAESTRA UX (ELIMINA EL PARPADEO) ---
  // Detectamos si es la PRIMERA carga (no hay datos) o una ACTUALIZACIÓN.
  const isInitialLoad = loading && data.chartData.length === 0;
  
  // Clase CSS para cuando actualizamos: baja la opacidad pero NO quita el contenido
  const updateEffect = loading && !isInitialLoad 
    ? "opacity-60 scale-[0.99] transition-all duration-300 pointer-events-none grayscale-[0.5]" 
    : "opacity-100 scale-100 transition-all duration-500";

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6 md:p-10 pb-20 bg-[#F8FAFC]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Visión 360</h1>
          <div className="text-slate-500 font-medium flex items-center gap-2 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              {/* El indicador parpadea RÁPIDO si está cargando */}
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${loading ? 'bg-indigo-400 duration-300' : 'bg-emerald-400 duration-1000'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${loading ? 'bg-indigo-500' : 'bg-emerald-500'} transition-colors duration-500`}></span>
            </span>
            <span className="text-sm tracking-tight transition-all">
              {loading ? 'Sincronizando datos...' : 'Análisis de capital en tiempo real'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
            <select 
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              disabled={loading} // Bloqueamos select mientras carga para evitar spam
              className="pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none w-full cursor-pointer hover:border-indigo-300 hover:shadow-lg focus:ring-4 focus:ring-indigo-100 transition-all appearance-none disabled:opacity-50"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <button 
            onClick={() => setModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> <span className="hidden sm:inline">Registrar</span>
          </button>
        </div>
      </div>

      {/* KPIS - APLICAMOS EL EFECTO HÍBRIDO */}
      {/* Si es carga inicial -> Skeletons. Si no -> Contenido con efecto de opacidad */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${!isInitialLoad ? updateEffect : ''}`}>
        {isInitialLoad ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-44 w-full" />) : (
          <>
            <KpiCard title="Ingresos" val={data.summary.totalIncome} icon={<ArrowUpRight/>} color="text-emerald-600" bg="bg-emerald-50" trend="Entradas" />
            <KpiCard title="Gastos" val={data.summary.totalExpense} icon={<ArrowDownLeft/>} color="text-rose-600" bg="bg-rose-50" trend="Salidas" />
            
            {/* Tarjeta de Presupuesto */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all relative overflow-hidden">
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Target size={20}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ejecución</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-800">{execution.toFixed(0)}%</h3>
                  <span className="text-xs text-slate-400 font-bold uppercase">del objetivo</span>
                </div>
                <div className="mt-4 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${execution > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min(execution, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Tarjeta de Balance Premium (Con Gradiente) */}
            <div className={`p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-500 ${data.summary.balance >= 0 ? 'bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200' : 'bg-gradient-to-br from-rose-900 to-rose-950 shadow-rose-200'}`}>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Balance Neto</p>
                <h3 className="text-3xl font-black mb-2 tracking-tight">{fmt(data.summary.balance)}</h3>
                <div className={`flex items-center gap-2 text-[10px] font-bold w-fit px-2.5 py-1 rounded-lg backdrop-blur-md ${data.summary.balance >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                   <Activity size={12}/> {data.summary.balance >= 0 ? 'SALUDABLE' : 'DÉFICIT'}
                </div>
              </div>
              <Wallet className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" size={110} />
            </div>
          </>
        )}
      </div>

      {/* GRÁFICOS - SIN PARPADEO DE SKELETON */}
      <div className={`grid grid-cols-1 lg:grid-cols-7 gap-8 ${!isInitialLoad ? updateEffect : ''}`}>
        {/* Tendencia */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col">
          <div className="mb-8">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter flex items-center gap-2">
              <Activity className="text-indigo-500" size={20}/> Tendencia
            </h3>
            <p className="text-xs text-slate-400 font-medium ml-7">Flujo de caja en el periodo</p>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {isInitialLoad ? <Skeleton className="h-full w-full rounded-[2rem]" /> : <TrendChart data={data.chartData} />}
          </div>
        </div>

        {/* Distribución */}
        <div className="lg:col-span-3 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter flex items-center justify-center lg:justify-start gap-2">
              <PieChart className="text-purple-500" size={20}/> Categorías
            </h3>
            <p className="text-xs text-slate-400 font-medium lg:ml-7">Top gastos del periodo</p>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {isInitialLoad ? <Skeleton className="h-full w-full rounded-full aspect-square mx-auto" /> : <CategoryChart data={data.categoryData} />}
          </div>
        </div>
      </div>

      {/* HISTORIAL - CON EMPTY STATE MEJORADO */}
      <div className={`bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${!isInitialLoad ? updateEffect : ''}`}>
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100"><Receipt size={20} className="text-slate-600"/></div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter">Movimientos</h3>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest">ACTIVIDAD RECIENTE</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          {isInitialLoad ? (
             <div className="space-y-4">
               {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
             </div>
          ) : data.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <div className="bg-slate-50 p-6 rounded-full mb-4"><Receipt size={40} className="text-slate-300"/></div>
              <p className="text-slate-500 font-bold">Sin movimientos registrados</p>
              <p className="text-xs text-slate-400">Intenta cambiar el filtro de fecha</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recent.map((tx) => (
                <TransactionRow 
                  key={tx.id} 
                  tx={tx} 
                  fmt={fmt} 
                  onDelete={async () => {
                    if(confirm("¿Eliminar transacción permanentemente?")) {
                      await deleteTransaction(tx.id);
                      loadData();
                    }
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickForm isOpen={isModalOpen} onClose={() => { setModalOpen(false); loadData(); }} />
    </div>
  );
}

// --- COMPONENTES VISUALES ---

function KpiCard({ title, val, icon, color, bg, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
      <div className="flex justify-between items-center mb-4">
        <div className={`p-2.5 ${bg} ${color} rounded-xl group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{title}</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)}
        </h3>
        <div className={`text-[10px] font-bold ${color} bg-opacity-10 px-2 py-0.5 rounded-md w-fit flex items-center gap-1`}>
          {title === 'Ingresos' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {trend}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx, fmt, onDelete }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white hover:bg-[#F8FAFC] rounded-[1.5rem] border border-transparent hover:border-slate-200 transition-all group cursor-default">
      <div className="flex items-center gap-4">
        <div className={`p-3.5 rounded-2xl transition-colors duration-300 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {tx.type === 'income' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{tx.description}</p>
          <div className="flex gap-2 items-center mt-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">{tx.category}</span>

          <span className="text-[10px] text-slate-400 font-medium">{new Date(tx.transaction_date).toLocaleDateString()}</span>            
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
          {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}