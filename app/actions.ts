"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { format } from "date-fns";

// --- CLIENTE SUPABASE ---
const getSupabase = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );
};

// --- FUNCIÓN PRINCIPAL DE GUARDADO ---
export async function addTransaction(data: any) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha expirado. Por favor inicia sesión de nuevo." };
  }

  // 1. NORMALIZACIÓN DE DATOS
  // Si recibimos un FormData (del formulario HTML), lo convertimos a objeto
  const rawData = data instanceof FormData ? Object.fromEntries(data.entries()) : data;

  // 2. LIMPIEZA INTELIGENTE DEL MONTO (Para formato COP/Latino)
  // Ejemplo entrada: "$ 1.500.000,50" -> Salida número: 1500000.50
  let amountStr = String(rawData.amount || "");

  // Quitamos símbolos de moneda y espacios
  amountStr = amountStr.replace(/[$\s]/g, "");

  // Lógica específica: Si tiene puntos y comas, asumimos formato 1.000,00
  // Quitamos los puntos (miles) y cambiamos la coma por punto (decimal)
  if (amountStr.includes('.') && amountStr.includes(',')) {
    amountStr = amountStr.replace(/\./g, "").replace(",", ".");
  }
  // Si solo tiene coma (ej: 50,5), la volvemos punto
  else if (amountStr.includes(',')) {
    amountStr = amountStr.replace(",", ".");
  }
  // Si solo tiene puntos (ej: 1.000), asumimos que son miles y los quitamos
  else if ((amountStr.match(/\./g) || []).length >= 1) {
      // Ojo: Si es 1.50 podría ser decimal en formato US, pero en COP suele ser 1500.
      // Para evitar ambigüedad, lo mejor es quitar todo lo que no sea dígito o punto decimal final.
      // Esta regex limpia todo excepto dígitos y el punto.
      amountStr = amountStr.replace(/\./g, "");
  }

  const amountValue = parseFloat(amountStr);

  // 3. VALIDACIÓN DE SEGURIDAD (El "Portero")
  // Si el valor no es un número o es 0/negativo, devolvemos error SIN tocar la BD
  if (!amountValue || isNaN(amountValue) || amountValue <= 0) {
    console.error("Error de validación. Valor recibido:", rawData.amount, "Procesado:", amountValue);
    return { error: "El monto debe ser un número válido mayor a cero." };
  }

  // 4. INSERCIÓN EN BASE DE DATOS
  const { error } = await supabase.from("transactions").insert([
    {
      user_id: user.id,
      amount: amountValue,
      type: rawData.type || 'expense',
      category: rawData.category || 'Otros',
      description: rawData.description?.toString().trim() || "Sin descripción",
      // Esta línea asegura que el dato sea visible en la gráfica de reportes
      transaction_date: new Date().toISOString().split('T')[0], 
      created_at: new Date().toISOString()
    }
  ]);
  if (error) {
    console.error("Error Supabase:", error.message);
    return { error: `Error al guardar: ${error.message}` };
  }

  // 5. ACTUALIZAR CACHÉ
revalidatePath("/", "layout"); 
  return { success: true };
}

// --- FUNCIONES DE LECTURA (Dashboard) ---

export async function getFinancialSummary(days: number = 30) {
  const supabase = await getSupabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type")
    .gte("transaction_date", startDate.toISOString());

  if (error || !data) return { totalIncome: 0, totalExpense: 0, balance: 0 };

  const summary = data.reduce((acc, curr) => {
    const val = Number(curr.amount);
    if (curr.type === "income") acc.totalIncome += val;
    else acc.totalExpense += val;
    return acc;
  }, { totalIncome: 0, totalExpense: 0 });

  return { ...summary, balance: summary.totalIncome - summary.totalExpense };
}

export async function getChartData(days: number = 30) {
  const supabase = await getSupabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from("transactions")
    .select("transaction_date, amount, type")
    .gte("transaction_date", startDate.toISOString())
    .order("transaction_date", { ascending: true });
  
  // ESTE ES EL TRUCO:
  // Le devolvemos 'transaction_date' pero TAMBIÉN le ponemos 'created_at' 
  // con el mismo valor para que la gráfica vieja no se rompa.
  return data?.map(d => ({ 
    ...d, 
    amount: Math.abs(d.amount),
    created_at: d.transaction_date // <--- Esta línea es la medicina
  })) || [];
}

export async function getCategoryData(days: number = 30) {
  const supabase = await getSupabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from("transactions")
    .select("category, amount")
    .eq("type", "expense")
    .gte("transaction_date", startDate.toISOString());

  const grouped = (data || []).reduce((acc: any, curr: any) => {
    const cat = curr.category || "Otros";
    acc[cat] = (acc[cat] || 0) + Math.abs(Number(curr.amount));
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value);
}

export async function getRecentTransactions() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .limit(10);
  return data || [];
}

export async function getUserBudget() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("user_settings")
    .select("monthly_budget")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.monthly_budget || 0;
}

export async function deleteTransaction(id: string) {
  const supabase = await getSupabase();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/");
} 


// --- FUNCIÓN PARA REPORTES (VERSION COMPATIBLE) ---
export async function getMonthlyStats() {
  const supabase = await getSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return [];

  // ELIMINAMOS cualquier filtro de fecha para traer TODO y ver dónde está el error
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, type, transaction_date")
    .eq("user_id", authData.user.id); // Traemos todo lo del usuario

  if (error || !transactions) return [];

  const months: Record<string, any> = {};

  transactions.forEach((tx: any) => {
    // Si la fecha es nula, usamos la fecha de creación como respaldo
    const dateStr = tx.transaction_date || tx.created_at;
    if (!dateStr) return;
    
    const [year, month] = dateStr.split('-');
    // Forzamos el nombre del mes y año para evitar confusiones de zona horaria
    const date = new Date(Number(year), Number(month) - 1, 15);
    const monthLabel = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase();
    
    if (!months[monthLabel]) {
      months[monthLabel] = { 
        month: monthLabel, 
        income: 0, 
        expense: 0,
        sortKey: `${year}-${month.padStart(2, '0')}` // Asegura que "2026-01" sea mayor a "2025-12"
      };
    }
    
    const amount = Number(tx.amount);
    if (tx.type === 'income') months[monthLabel].income += amount;
    else months[monthLabel].expense += amount;
  });

  // Ordenamos y mostramos los 6 meses más RECIENTES (cronológicamente los últimos)
  return Object.values(months)
    .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6); 
}
// --- FUNCIÓN DE IA (AUDITORÍA INTELIGENTE) ---
export async function generateAIAudit() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return "No se pudo identificar al usuario.";

  // 1. Obtenemos los últimos 20 movimientos
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, type, category, transaction_date, description")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(20);

  if (!transactions || transactions.length === 0) {
    return "No tienes suficientes movimientos para realizar una auditoría. Registra algunos gastos e inténtalo de nuevo.";
  }

  // 2. Preparamos el texto para la IA
  const txSummary = transactions.map(t => 
    `- ${t.type === 'income' ? 'Ingreso' : 'Gasto'} de $${t.amount} en ${t.category} (${t.description})`
  ).join("\n");

 // 2. Prompt optimizado para Auditoría Profesional y Concisa
  const prompt = `
    Actúa como un Auditor Financiero Senior con enfoque en optimización de flujo de caja. 
    Analiza con rigor profesional los siguientes movimientos:
    ${txSummary}

    Genera un dictamen ejecutivo de máximo 150 palabras. 
    Usa este formato estricto:
    
    📌 **DIAGNÓSTICO**: (Un párrafo técnico sobre la salud del flujo de caja).
    🚨 **ALERTA CRÍTICA**: (Identifica el gasto más innecesario o el riesgo detectado).
    💡 **ESTRATEGIA**: (Una acción concreta de ahorro basada en los datos).

    REGLAS: Habla de "Tú". Sé directo, profesional y usa emojis mínimos. No incluyas introducciones ni despedidas.

  `;
  
try {
    // 1. Inicializamos con la clave del .env
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    
    // 2. Usamos el modelo flash que es el que viene por defecto en el nivel gratuito
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    // 3. Llamada simplificada (evitamos configuraciones complejas que causan 404)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;

  } catch (error: any) {
    console.error("Error IA detallado:", error);
    
    // Si persiste el 404, imprimimos la ayuda exacta
    if (error.message?.includes('404')) {
      console.log("❌ ERROR 404: Google no encuentra el modelo con esa clave.");
      console.log("👉 SOLUCIÓN: Reinicia tu terminal con 'npm run dev' para que Next.js detecte la nueva clave del .env.local");
    }
    
    return "Lo siento, mi cerebro financiero está saturado. Intenta de nuevo en unos segundos.";
  }
}