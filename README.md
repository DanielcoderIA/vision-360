# 💎 Visión 360: Ecosistema de Auditoría Financiera con IA

**Live Demo:** https://vision-360-2oir.vercel.app/login

`![Dashboard Preview](./public/screenshots/Capturadepantalla(683).png)` 

**Visión 360** es una plataforma de gestión financiera de alto rendimiento que transforma el registro de transacciones en decisiones estratégicas. Utilizando un motor de **Inteligencia Artificial (Google Gemini)**, la aplicación actúa como un auditor financiero personal, identificando patrones de gasto y optimizando el flujo de caja en tiempo real.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router & Server Actions) |
| **Base de Datos** | Supabase (PostgreSQL) |
| **Autenticación** | Supabase Auth con SSR Middleware |
| **IA Generativa** | Google Generative AI (Modelo: `gemini-flash-latest`) |
| **Estilos** | Tailwind CSS & Lucide Icons |
| **Procesamiento** | Regex para Normalización de Moneda (COP/Latam) |

---

## 🌟 Características Destacadas

### 1. Normalización Inteligente de Datos (Latam-Ready)
El sistema integra una lógica de limpieza de datos robusta en el servidor (`addTransaction`) que procesa formatos de moneda latinoamericanos:
* **Entrada**: `"$ 1.500.000,50"`
* **Procesamiento**: Eliminación de símbolos, normalización de puntos de millar y conversión de comas decimales mediante expresiones regulares.
* **Salida**: `1500000.50` (formato numérico puro para BD).

### 2. Auditoría Financiera IA (NLP)
Mediante el SDK de Google Generative AI, la aplicación analiza los últimos 20 movimientos del usuario para generar un dictamen ejecutivo estructurado:
* 📌 **Diagnóstico**: Análisis de la salud del flujo de caja.
* 🚨 **Alerta Crítica**: Identificación de riesgos o fugas de capital.
* 💡 **Estrategia**: Acciones concretas de ahorro con cálculos estimados.

### 3. Reportes Dinámicos y Ventana Móvil
La lógica de visualización en `getMonthlyStats` garantiza que la información sea siempre relevante:
* **Ordenamiento Cronológico**: Implementación de un `sortKey` con `padStart(2, '0')` para asegurar que el orden de meses y años (ej. 2025 vs 2026) sea matemáticamente exacto.
* **Ventana Móvil**: Visualización automática de los últimos 6 meses para un análisis de tendencia actualizado.

---

## 📈 Lógica de Negocio y Métricas

La aplicación utiliza fórmulas para determinar la salud financiera del usuario en tiempo real:

$$Balance = \sum Ingresos - \sum Gastos$$

$$Tasa\ de\ Ahorro = \left( \frac{Ingresos - Gastos}{Ingresos} \right) \times 100$$

Tras cada operación, el sistema utiliza `revalidatePath("/", "layout")` para asegurar que el Dashboard, los Reportes y las Gráficas estén sincronizados de forma atómica.

---

## 🚀 Configuración del Proyecto

### 1. Variables de Entorno (`.env.local`)
Crea un archivo en la raíz con las siguientes claves:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_key
GOOGLE_API_KEY=tu_api_key_de_gemini

2. Instalación:

# Instalar dependencias
npm install

# Iniciar entorno de desarrollo
npm run dev

# Construir para producción
npm run build
🏗️ Estructura del Proyecto
/app/actions.ts: Lógica de servidor, validaciones de seguridad y conexión con IA.

/app/reportes/page.tsx: Dashboard visual con gráficas de rendimiento y modal de auditoría.

/app/movimientos/page.tsx: Gestión de CRUD de transacciones.

📝 Próximos Pasos (Roadmap)
[ ] Implementación de OCR para escanear facturas físicas.

[ ] Alertas automáticas vía WhatsApp ante excedentes de presupuesto.

[ ] Soporte para múltiples divisas con tasa de cambio en tiempo real.

Generado con ❤️ para una gestión financiera profesional.

