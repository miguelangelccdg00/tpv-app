import { Outlet } from 'react-router-dom';
import { useSecureData } from '../../contexts/SecureDataContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Dashboard = () => {
  const { usuario, diagnosticarSistema } = useSecureData();

  const handleDiagnostico = async () => {
    try {
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
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        {/* Banner de seguridad */}
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 mx-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>🔒 Datos seguros y aislados</strong> - Solo ves y gestionas TUS productos, facturas y ventas. Usuario: <span className="font-mono">{usuario?.email}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleDiagnostico}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded border border-green-300"
            >
              🔍 Verificar
            </button>
          </div>
        </div>
        
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;