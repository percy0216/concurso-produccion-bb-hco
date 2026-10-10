import { login } from './actions'
import { Timer, Building2, Users, Zap, Shield, Eye, EyeOff, Loader2 } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding/Welcome */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto w-full text-center">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Timer size={48} className="text-white" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            Sistema de análisis
            <br />
            <span className="text-blue-200">de negocio</span>
          </h1>

          <p className="text-lg text-blue-100/80 mb-12 max-w-lg mx-auto leading-relaxed">
            Plataforma de monitoreo en tiempo real para optimizar la producción 
            y toma de decisiones basada en datos.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { icon: Zap, label: 'Tiempo real', desc: 'Captura instantánea' },
              { icon: Users, label: 'Equipos', desc: 'Colaboración fluida' },
              { icon: Shield, label: 'Seguro', desc: 'Datos protegidos' },
            ].map((item, i) => (
              <div key={i} className="text-left p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-3">
                  <item.icon size={24} className="text-white" />
                </div>
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-xs text-blue-200/70">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Version/Build info */}
          <div className="text-xs text-blue-300/60 font-mono">
            v1.0.0 • Concurso Producción BB-HCO
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="relative z-10 text-center text-xs text-blue-300/50">
          Desarrollado para Tesis Percy Rojas
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-800 mb-2">Bienvenido de nuevo</h2>
            <p className="text-gray-500">Inicia sesión para acceder a tu panel de control</p>
          </div>

          {/* Alert messages */}
          {(params.error || params.message) && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
              params.error 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {params.error ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-medium">{params.error || params.message}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" action={login}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3.5 border-2 border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Mostrar/ocultar contraseña"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Remember/Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin hidden" aria-hidden="true" />
              <span>Iniciar sesión</span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿No tienes acceso? Contacta al administrador
            </p>
          </div>

          {/* Security badges */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Autenticación segura</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>Supabase Auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}