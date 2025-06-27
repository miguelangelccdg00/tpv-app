import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      path: '/dashboard/tpv',
      name: 'TPV (Punto de Venta)',
      icon: '🛒'
    },
    {
      path: '/dashboard/productos',
      name: 'Productos',
      icon: '📦'
    },
    {
      path: '/dashboard/ventas',
      name: 'Historial de Ventas',
      icon: '📊'
    },
    {
      path: '/dashboard/inventario',
      name: 'Inventario',
      icon: '📋'
    },
    {
      path: '/dashboard/facturas',
      name: 'Facturas de Proveedores',
      icon: '🧾'
    },
    {
      path: '/dashboard/configuracion',
      name: 'Configuración',
      icon: '⚙️'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🏪 TPV Sistema</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;