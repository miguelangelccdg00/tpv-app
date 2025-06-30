import { Outlet } from 'react-router-dom';
import { useSecureData } from '../../contexts/SecureDataContext';
import { useState } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import Header from './Header';

const Dashboard = () => {
  const { usuario, diagnosticarSistema } = useSecureData();
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleDiagnostico = async () => {
    try {
      setIsLoading(true);
      const resultado = await diagnosticarSistema();
      
      const mensaje = `🔍 DIAGNÓSTICO DE SEGURIDAD DEL SISTEMA\n\n` +
                     `👤 Usuario activo: ${resultado.usuario}\n` +
                     `🔒 Aislamiento de datos: ${resultado.aislamiento}\n\n` +
                     `📊 TUS DATOS (solo visibles para ti):\n` +
                     `📦 Productos: ${resultado.productos}\n` +
                     `📄 Facturas: ${resultado.facturas}\n` +
                     `💰 Ventas: ${resultado.ventas}\n` +
                     `⚙️ Configuración: ${resultado.configuracion}\n\n` +
                     `🛡️ GARANTÍAS DE SEGURIDAD:\n` +
                     `• Filtrado automático por usuario en TODAS las consultas\n` +
                     `• Doble verificación de propiedad de datos\n` +
                     `• Otros usuarios NO pueden ver tus datos\n` +
                     `• Tú NO puedes ver datos de otros usuarios\n` +
                     `• Operaciones CRUD restringidas a tus documentos\n\n` +
                     `⏰ Verificado: ${new Date().toLocaleString()}\n` +
                     `${resultado.error ? `⚠️ Error: ${resultado.error}` : '✅ Sistema seguro'}`;
      
      alert(mensaje);
    } catch (error) {
      alert(`❌ Error en diagnóstico: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Security Banner */}
        {showSecurityBanner && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 mx-6 mt-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Sistema Seguro
                    </h3>
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Tus datos están completamente aislados y seguros. Solo puedes ver y gestionar 
                    <span className="font-medium"> TUS productos, facturas y ventas</span>.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Usuario activo: <span className="font-mono bg-gray-100 px-1 rounded">{usuario?.email}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDiagnostico}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      🔍 Verificar Seguridad
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowSecurityBanner(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;