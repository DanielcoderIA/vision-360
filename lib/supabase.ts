import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * 🛠️ CONFIGURACIÓN DE SEGURIDAD
 * Extraemos las variables del entorno. Usamos el operador '||' para que, 
 * si no existen, el sistema reciba un texto vacío en lugar de 'undefined',
 * lo que evita que el constructor de Supabase falle inmediatamente.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// LOG DE DIAGNÓSTICO (Solo aparecerá en tu terminal de VS Code)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Advertencia: Las llaves de Supabase no se detectaron en .env.local");
}

/**
 * 🌐 CLIENTE DEL NAVEGADOR (Client-Side)
 * Se usa en Sidebar, Dashboard y formularios.
 * Esta función valida las llaves antes de crear el cliente.
 */
export const createClient = () => {
  // Si las llaves fallan, devolvemos un cliente con datos "placeholder" 
  // para evitar que la app explote antes de que el usuario vea la solución.
  if (!supabaseUrl || !supabaseAnonKey) {
    return createBrowserClient(
      'https://your-project.supabase.co', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * 🔒 CLIENTE DE SERVIDOR (Admin)
 * Únicamente para procesos internos (Server Actions).
 */
export const serverClient = createSupabaseClient(
  supabaseUrl || 'https://placeholder.co',
  supabaseServiceRole || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)