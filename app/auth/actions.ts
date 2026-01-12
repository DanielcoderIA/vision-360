"use server";

import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * 🛠️ CLIENTE INTERNO PARA AUTH
 * Usa cookies dinámicas para que el navegador guarde la sesión.
 */
async function getSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Se ignora en Server Actions
          }
        },
      },
    }
  );
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await getSupabaseAuthClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciales inválidas o el usuario no existe." };
  }

  revalidatePath("/", "layout");
  // No usamos redirect("/") aquí porque el cliente (page.tsx) 
  // ahora usa window.location.href para mayor seguridad.
  return { success: true };
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const supabase = await getSupabaseAuthClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    return { error: "Error al registrarse. Revisa si el correo ya existe." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function logout() {
  const supabase = await getSupabaseAuthClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}