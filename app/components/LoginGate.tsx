"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Box, Mail, Lock, ArrowRight } from "lucide-react";

export function LoginGate() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email.trim(), pass);
      else await createUserWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error de autenticación");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setErr(null);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error con Google"); }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090f] p-4">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-white/10">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30">
            <Box className="h-7 w-7" />
          </div>
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase tracking-widest text-indigo-400">FOTOVENDE</span>
            <h1 className="text-xl font-extrabold text-white mt-0.5">{mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}</h1>
            <p className="mt-1 text-xs text-zinc-400">5 créditos gratis al registrarte</p>
          </div>
        </div>

        <button onClick={google} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-zinc-900 py-3 hover:bg-zinc-100 transition cursor-pointer">
          <span className="text-lg">G</span> Continuar con Google
        </button>
        <div className="my-4 flex items-center gap-3 text-[10px] text-zinc-500"><div className="h-px flex-1 bg-white/10" /><span>o con email</span><div className="h-px flex-1 bg-white/10" /></div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full rounded-xl border border-white/10 bg-[#0b0f19] pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-500" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-[#0b0f19] pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-500" />
          </div>
        </div>

        {err && <p className="mt-3 text-center text-xs font-semibold text-red-400">{err}</p>}

        <button onClick={submit} disabled={loading || !email || !pass} className="btn-glow-indigo mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white cursor-pointer disabled:opacity-50">
          <span>{loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mt-4 text-center text-xs text-zinc-400">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer">
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </main>
  );
}
