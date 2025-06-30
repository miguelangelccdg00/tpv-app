import { useAuth } from '../../AuthContext';
import { useSecureData } from '../../contexts/SecureDataContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  Cog6ToothIcon, 
  UserCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const Header = () => {
  const { usuario, logout } = useAuth();
  const { secureGetDocs } = useSecureData();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userConfig, setUserConfig] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Cargar datos del usuario
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!usuario?.email) return;

      try {
        // Cargar perfil
        const perfiles = await secureGetDocs('perfiles', []);
        if (perfiles.length > 0) {
          setUserProfile(perfiles[0]);
        }

        // Cargar configuración
        const configuraciones = await secureGetDocs('configuraciones', []);
        if (configuraciones.length > 0) {
          setUserConfig(configuraciones[0]);
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }
    };

    cargarDatosUsuario();
  }, [usuario, secureGetDocs]);

  // Función para obtener el nombre del usuario con prioridad unificada
  const obtenerNombreCajero = () => {
    // 1. Prioridad: nombre del perfil
    if (userProfile?.nombre && userProfile.nombre.trim()) {
      return userProfile.nombre.trim();
    }
    
    // 2. Prioridad: nombre del cajero en configuración
    if (userConfig?.nombreCajero && userConfig.nombreCajero.trim() && userConfig.nombreCajero !== 'Cajero') {
      return userConfig.nombreCajero.trim();
    }
    
    // 3. Prioridad: displayName de Firebase Auth
    if (usuario?.displayName && usuario.displayName.trim()) {
      return usuario.displayName.trim();
    }
    
    // 4. Prioridad: email formateado (sin dominio y con primera letra mayúscula)
    if (usuario?.email) {
      const nombreEmail = usuario.email.split('@')[0];
      return nombreEmail.charAt(0).toUpperCase() + nombreEmail.slice(1);
    }
    
    // 5. Fallback por defecto
    return 'Usuario';
  };

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Panel de control principal',
          icon: '🏪'
        };
      case '/dashboard/':
        return {
          title: 'Dashboard',
          subtitle: 'Panel de control principal',
          icon: '🏪'
        };
      case '/dashboard/tpv':
        return {
          title: 'Punto de Venta',
          subtitle: 'Procesa ventas y gestiona clientes',
          icon: '🛒'
        };
      case '/dashboard/productos':
        return {
          title: 'Productos',
          subtitle: 'Gestiona tu catálogo e inventario',
          icon: '📦'
        };
      case '/dashboard/ventas':
        return {
          title: 'Ventas',
          subtitle: 'Analiza el rendimiento de tu negocio',
          icon: '📊'
        };
      case '/dashboard/inventario':
        return {
          title: 'Inventario',
          subtitle: 'Controla stock y movimientos',
          icon: '📋'
        };
      case '/dashboard/facturas':
        return {
          title: 'Facturas',
          subtitle: 'Gestiona facturas de proveedores',
          icon: '🧾'
        };
      case '/dashboard/configuracion':
        return {
          title: 'Configuración',
          subtitle: 'Personaliza tu sistema TPV',
          icon: '⚙️'
        };
      case '/dashboard/perfil':
        return {
          title: 'Mi Perfil',
          subtitle: 'Gestiona tu información personal',
          icon: '👤'
        };
      case '/dashboard/ayuda':
        return {
          title: 'Centro de Ayuda',
          subtitle: 'Encuentra respuestas y aprende a usar el sistema',
          icon: '❓'
        };
      default:
        // Para cualquier ruta que empiece con /dashboard
        if (location.pathname.startsWith('/dashboard')) {
          return {
            title: 'Dashboard',
            subtitle: 'Panel de control principal',
            icon: '🏪'
          };
        }
        return {
          title: 'Sistema TPV',
          subtitle: 'Aplicación de punto de venta',
          icon: '🏪'
        };
    }
  };

  const pageInfo = getPageInfo();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleNavigation = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const handleSettingsClick = () => {
    navigate('/dashboard/configuracion');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[100]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title Section */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl">{pageInfo.icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
              <p className="text-sm text-gray-600">{pageInfo.subtitle}</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:flex relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            {/* Settings */}
            <button 
              onClick={handleSettingsClick}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {/* Avatar del usuario */}
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt="Avatar del usuario"
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {obtenerNombreCajero().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {obtenerNombreCajero()}
                    </div>
                    <div className="text-xs text-gray-500">Administrador</div>
                  </div>
                </div>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[9999] border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">{usuario?.email}</div>
                    <div className="text-xs text-gray-500">Cuenta activa</div>
                  </div>
                  <button 
                    onClick={() => handleNavigation('/dashboard/perfil')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mi Perfil
                  </button>
                  <button 
                    onClick={() => handleNavigation('/dashboard/configuracion')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Configuración
                  </button>
                  <button 
                    onClick={() => handleNavigation('/dashboard/ayuda')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Ayuda
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;