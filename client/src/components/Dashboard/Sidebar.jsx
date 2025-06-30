import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { 
  ShoppingCartIcon,
  CubeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PowerIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const { logout, usuario } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: HomeIcon,
      description: 'Vista general'
    },
    {
      path: '/dashboard/tpv',
      name: 'TPV',
      icon: ShoppingCartIcon,
      description: 'Punto de Venta'
    },
    {
      path: '/dashboard/productos',
      name: 'Productos',
      icon: CubeIcon,
      description: 'Gestión de productos'
    },
    {
      path: '/dashboard/ventas',
      name: 'Ventas',
      icon: ChartBarIcon,
      description: 'Historial y análisis'
    },
    {
      path: '/dashboard/inventario',
      name: 'Inventario',
      icon: ClipboardDocumentListIcon,
      description: 'Control de stock'
    },
    {
      path: '/dashboard/facturas',
      name: 'Facturas',
      icon: DocumentTextIcon,
      description: 'Proveedores'
    },
    {
      path: '/dashboard/configuracion',
      name: 'Configuración',
      icon: Cog6ToothIcon,
      description: 'Ajustes del sistema'
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
    <div className={`bg-gray-900 text-white transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-64'
    } min-h-screen flex flex-col`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">T</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">TPV Sistema</h2>
                <p className="text-xs text-gray-400">Gestión comercial</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">T</span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <IconComponent className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`} />
              
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">
                    {item.description}
                  </p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  {usuario?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {usuario?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400">
                  {usuario?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mb-4 flex justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center" title={usuario?.email}>
              <span className="text-sm font-bold">
                {usuario?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-3 text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Cerrar Sesión' : ''}
        >
          <PowerIcon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;