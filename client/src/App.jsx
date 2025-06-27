import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { SecureDataProvider } from './contexts/SecureDataContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import TPVPage from './components/Pages/TPV/TPVPage';
import ProductosPage from './components/Pages/Productos/ProductosPage';
import VentasPage from './components/Pages/Ventas/VentasPage';
import InventarioPage from './components/Pages/Inventario/InventarioPage';
import FacturasPage from './components/Pages/Facturas/FacturasPage';
import ConfiguracionPage from './components/Pages/Configuracion/ConfiguracionPage';

function AppContent() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!usuario ? (
          <>
            <Route path="/login" element={<LoginForm />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/dashboard" element={
              <SecureDataProvider>
                <Dashboard />
              </SecureDataProvider>
            }>
              <Route index element={<Navigate to="/dashboard/tpv" replace />} />
              <Route path="tpv" element={<TPVPage />} />
              <Route path="productos" element={<ProductosPage />} />
              <Route path="ventas" element={<VentasPage />} />
              <Route path="inventario" element={<InventarioPage />} />
              <Route path="facturas" element={<FacturasPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;