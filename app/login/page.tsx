'use client';

import { useState } from 'react';
import { login, signup } from '@/app/auth/actions'; 
import { ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    
    // Ejecutamos la acción en el servidor
    const result = isLogin ? await login(formData) : await signup(formData);

    if (result?.error) {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    } else {
      // 🚀 SOLUCIÓN AL BUCLE INFINITO:
      // En lugar de confiar en la redirección automática del servidor (que está fallando),
      // forzamos al navegador a ir a la raíz. Esto garantiza que el Middleware (proxy.ts)
      // lea las cookies de Supabase recién guardadas.
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 mb-2 text-center">Visión 360</h1>
        <p className="text-slate-500 text-center mb-8 text-sm">
          {isLogin ? 'Ingresa a tu panel financiero' : 'Crea tu cuenta profesional'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {message.text}
            </div>
          )}

          {!isLogin && (
            <input name="full_name" type="text" placeholder="Nombre completo" required className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all" />
          )}

          <input name="email" type="email" placeholder="Correo electrónico" required className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all" />
          
          <input name="password" type="password" placeholder="Contraseña" required className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all" />

          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : (
              <> {isLogin ? 'Iniciar Sesión' : 'Comenzar Ahora'} <ArrowRight size={18} /> </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-blue-600 hover:underline">
            {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}