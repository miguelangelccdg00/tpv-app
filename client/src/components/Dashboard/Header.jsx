import { useAuth } from '../../AuthContext';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const { usuario } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard/tpv':
        return 'Punto de Venta (TPV)';
      case '/dashboard/productos':
        return 'Gestión de Productos';
      case '/dashboard/ventas':
        return 'Historial de Ventas';
      case '/dashboard/inventario':
        return 'Gestión de Inventario';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <h1>{getPageTitle()}</h1>
        
        <div className="user-info">
          <span>Hola, {usuario?.email}</span>
          <div className="user-avatar">👤</div>
        </div>
      </div>
    </header>
  );
};

export default Header;