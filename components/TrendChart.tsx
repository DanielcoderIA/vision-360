"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChartProps {
  data: { created_at: string; amount: number; type: string }[];
}

export default function TrendChart({ data }: ChartProps) {
  // 1. Lógica de Agrupación: Convertimos timestamps a días únicos y sumamos montos
  const processedData = data.reduce((acc: any[], curr) => {
    const dateKey = format(parseISO(curr.created_at), 'yyyy-MM-dd');
    const existing = acc.find(item => item.date === dateKey);

    if (existing) {
      if (curr.type === 'income') existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({
        date: dateKey,
        shortDate: format(parseISO(curr.created_at), 'dd MMM', { locale: es }),
        income: curr.type === 'income' ? curr.amount : 0,
        expense: curr.type === 'expense' ? curr.amount : 0,
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Si no hay datos, mostramos un estado vacío elegante
  if (processedData.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
        <p className="text-sm font-medium">Aún no hay suficientes datos para mostrar tendencias.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {/* Gradiente Verde para Ingresos */}
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
          {/* Gradiente Rojo para Gastos */}
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        
        <XAxis 
          dataKey="shortDate" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94A3B8', fontSize: 12 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          tickFormatter={(value) => `$${value / 1000}k`} 
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Area 
          type="monotone" 
          dataKey="income" 
          stroke="#10B981" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorIncome)" 
        />
        <Area 
          type="monotone" 
          dataKey="expense" 
          stroke="#F43F5E" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorExpense)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Tooltip personalizado estilo Glass
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 text-xs">
        <p className="font-bold text-slate-700 mb-2 uppercase tracking-wider">{label}</p>
        <div className="space-y-1">
          <p className="text-emerald-600 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"/>
            Ingresos: ${new Intl.NumberFormat('es-CO').format(payload[0].value)}
          </p>
          <p className="text-rose-600 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"/>
            Gastos: ${new Intl.NumberFormat('es-CO').format(payload[1].value)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};