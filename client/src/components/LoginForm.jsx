import { useState } from "react";
import { ShoppingCartIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../AuthContext";

// CSS personalizado para las animaciones
const animationStyles = `
  @keyframes blob {
    0% {
      transform: translate(0px, 0px) scale(1) rotate(0deg);
    }
    25% {
      transform: translate(40px, -60px) scale(1.1) rotate(90deg);
    }
    50% {
      transform: translate(-40px, 40px) scale(0.9) rotate(180deg);
    }
    75% {
      transform: translate(60px, 20px) scale(1.05) rotate(270deg);
    }
    100% {
      transform: translate(0px, 0px) scale(1) rotate(360deg);
    }
  }
  
  @keyframes blob-slow {
    0% {
      transform: translate(0px, 0px) scale(1);
    }
    33% {
      transform: translate(-50px, -30px) scale(1.2);
    }
    66% {
      transform: translate(30px, 50px) scale(0.8);
    }
    100% {
      transform: translate(0px, 0px) scale(1);
    }
  }
  
  @keyframes float {
    0% {
      transform: translateY(0px) translateX(0px);
    }
    33% {
      transform: translateY(-20px) translateX(10px);
    }
    66% {
      transform: translateY(10px) translateX(-10px);
    }
    100% {
      transform: translateY(0px) translateX(0px);
    }
  }
  
  .animate-blob {
    animation: blob 12s infinite ease-in-out;
  }
  
  .animate-blob-slow {
    animation: blob-slow 20s infinite ease-in-out;
  }
  
  .animate-float {
    animation: float 8s infinite ease-in-out;
  }
  
  .animation-delay-1000 {
    animation-delay: 1s;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  .animation-delay-3000 {
    animation-delay: 3s;
  }
  
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  
  .animation-delay-6000 {
    animation-delay: 6s;
  }
`;

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loginLoading) return;
    
    setLoginLoading(true);
    try {
      await login(email, pass);
      console.log("Login exitoso, debería redirigir");
    } catch (err) {
      console.error("Error de login:", err);
      alert(`Error al iniciar sesión: ${err.message}\n\nCredenciales de prueba:\nEmail: admin@tpv.com\nPassword: admin123`);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      {/* Inyectar estilos CSS */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 overflow-hidden">
      {/* Enhanced Background animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary blob - large blue */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        
        {/* Secondary blob - purple */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        {/* Tertiary blob - teal */}
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
        
        {/* Quaternary blob - pink */}
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-6000"></div>
        
        {/* Small accent blobs */}
        <div className="absolute top-1/2 left-0 w-40 h-40 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-lg opacity-40 animate-blob-slow"></div>
        <div className="absolute top-3/4 right-0 w-48 h-48 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full mix-blend-multiply filter blur-lg opacity-40 animate-blob-slow animation-delay-3000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 right-1/2 w-8 h-8 bg-white rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-blue-300 rounded-full opacity-30 animate-float animation-delay-1000"></div>
        <div className="absolute top-2/3 right-1/3 w-4 h-4 bg-purple-300 rounded-full opacity-25 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-1/2 left-1/4 w-5 h-5 bg-pink-300 rounded-full opacity-20 animate-float animation-delay-3000"></div>
        
        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Main container with glass effect */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-500 hover:scale-105">
          {/* Header section */}
          <div className="text-center p-8 pb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl">
                <ShoppingCartIcon className="h-12 w-12 text-white mx-auto" />
              </div>
            </div>
            <h2 className="mt-6 text-4xl font-bold text-white animate-fade-in-up">
              TPV Sistema
            </h2>
            <p className="mt-2 text-lg text-blue-100 animate-fade-in-up animation-delay-200">
              Bienvenido de vuelta
            </p>
          </div>

          {/* Form section */}
          <div className="px-8 pb-8">
            <form
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="space-y-5">
                {/* Email field */}
                <div className="group">
                  <label 
                    htmlFor="email" 
                    className={`block text-sm font-medium transition-all duration-300 ${
                      focusedField === 'email' ? 'text-blue-300' : 'text-gray-300'
                    }`}
                  >
                    Correo electrónico
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm ${
                        focusedField === 'email' 
                          ? 'border-blue-400 bg-white/20 shadow-lg shadow-blue-500/25' 
                          : 'border-white/30 hover:border-white/50'
                      }`}
                      placeholder="admin@tpv.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 ${
                      focusedField === 'email' ? 'w-full' : 'w-0'
                    }`}></div>
                  </div>
                </div>

                {/* Password field */}
                <div className="group">
                  <label 
                    htmlFor="password" 
                    className={`block text-sm font-medium transition-all duration-300 ${
                      focusedField === 'password' ? 'text-blue-300' : 'text-gray-300'
                    }`}
                  >
                    Contraseña
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm ${
                        focusedField === 'password' 
                          ? 'border-blue-400 bg-white/20 shadow-lg shadow-blue-500/25' 
                          : 'border-white/30 hover:border-white/50'
                      }`}
                      placeholder="admin123"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                    <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 ${
                      focusedField === 'password' ? 'w-full' : 'w-0'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white transition-all duration-300 transform ${
                    loginLoading 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    {loginLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <UserIcon className="h-6 w-6 mr-3 transition-transform duration-300 group-hover:scale-110" />
                        Iniciar sesión
                      </>
                    )}
                  </div>
                </button>
              </div>
              
              {/* Demo credentials */}
              <div className="text-center pt-4">
                <div className="inline-flex items-center px-4 py-2 bg-white/5 rounded-lg border border-white/20 backdrop-blur-sm">
                  <p className="text-sm text-gray-300">
                    <span className="text-blue-300 font-medium">Demo:</span> admin@tpv.com / admin123
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
