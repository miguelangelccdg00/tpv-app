import { useState, useEffect } from 'react';
import { where } from 'firebase/firestore';
import { useSecureData } from '../../contexts/SecureDataContext';
import { useAuth } from '../../AuthContext';
import {
  CurrencyEuroIcon,
  ShoppingCartIcon,
  CubeIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DashboardHome = () => {
  const { usuario } = useAuth();
  const { secureGetDocs } = useSecureData();
  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasHoy: 0,
    totalProductos: 0,
    productosStock: 0,
    totalFacturas: 0,
    facturasHoy: 0,
    ventasRecientes: [],
    productosVendidos: 0
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userConfig, setUserConfig] = useState(null);

  useEffect(() => {
    if (usuario) {
      cargarDatosIniciales();
    }
  }, [usuario]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarEstadisticas(),
        cargarPerfilUsuario(),
        cargarConfiguracionUsuario()
      ]);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPerfilUsuario = async () => {
    if (!usuario?.email) return;
    
    try {
      console.log('🔍 DashboardHome - Buscando perfil para usuario:', usuario.email);
      const perfiles = await secureGetDocs('perfiles', []);
      console.log('📄 Perfiles encontrados:', perfiles);
      
      if (perfiles.length > 0) {
        setUserProfile(perfiles[0]);
        console.log('✅ Perfil cargado:', perfiles[0]);
      } else {
        console.log('⚠️ No se encontró perfil para el usuario');
      }
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
    }
  };

  const cargarConfiguracionUsuario = async () => {
    if (!usuario?.email) return;
    
    try {
      console.log('🔍 DashboardHome - Buscando configuración para usuario:', usuario.email);
      const config = await secureGetDocs('configuraciones', []);
      console.log('⚙️ Configuraciones encontradas:', config);
      
      if (config.length > 0) {
        setUserConfig(config[0]);
        console.log('✅ Configuración cargada:', config[0]);
      } else {
        console.log('⚠️ No se encontró configuración para el usuario');
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      // Cargar ventas
      const ventas = await secureGetDocs('ventas', []);
      const hoy = new Date().toDateString();
      const ventasHoy = ventas.filter(venta => 
        new Date(venta.fecha).toDateString() === hoy
      );
      
      // Cargar productos
      const productos = await secureGetDocs('productos', []);
      const productosConStock = productos.filter(p => p.stock > 0);
      
      // Cargar facturas
      const facturas = await secureGetDocs('facturas', []);
      const facturasHoy = facturas.filter(factura => 
        new Date(factura.fecha).toDateString() === hoy
      );

      // Calcular totales
      const totalVentas = ventas.reduce((total, venta) => total + (venta.total || 0), 0);
      const totalVentasHoy = ventasHoy.reduce((total, venta) => total + (venta.total || 0), 0);
      const totalProductosVendidos = ventas.reduce((total, venta) => 
        total + (venta.productos?.length || 0), 0
      );

      // Ventas recientes (últimas 5)
      const ventasRecientes = ventas
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);

      setStats({
        totalVentas,
        ventasHoy: totalVentasHoy,
        totalProductos: productos.length,
        productosStock: productosConStock.length,
        totalFacturas: facturas.length,
        facturasHoy: facturasHoy.length,
        ventasRecientes,
        productosVendidos: totalProductosVendidos
      });
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Función para obtener el nombre del usuario con prioridad
  const getUserDisplayName = () => {
    console.log('🔍 DashboardHome - getUserDisplayName debugging:');
    console.log('- userProfile:', userProfile);
    console.log('- userConfig:', userConfig);
    console.log('- usuario:', usuario);
    
    // 1. Prioridad: nombre del perfil
    if (userProfile?.nombre && userProfile.nombre.trim()) {
      console.log('✅ Usando nombre del perfil:', userProfile.nombre.trim());
      return userProfile.nombre.trim();
    }
    
    // 2. Prioridad: nombre del cajero en configuración
    if (userConfig?.nombreCajero && userConfig.nombreCajero.trim() && userConfig.nombreCajero !== 'Cajero') {
      console.log('✅ Usando nombre del cajero:', userConfig.nombreCajero.trim());
      return userConfig.nombreCajero.trim();
    }
    
    // 3. Prioridad: displayName de Firebase Auth
    if (usuario?.displayName && usuario.displayName.trim()) {
      console.log('✅ Usando displayName:', usuario.displayName.trim());
      return usuario.displayName.trim();
    }
    
    // 4. Prioridad: email formateado (sin dominio y con primera letra mayúscula)
    if (usuario?.email) {
      const nombreEmail = usuario.email.split('@')[0];
      const nombreFormateado = nombreEmail.charAt(0).toUpperCase() + nombreEmail.slice(1);
      console.log('✅ Usando email formateado:', nombreFormateado);
      return nombreFormateado;
    }
    
    // 5. Fallback por defecto
    console.log('⚠️ Usando fallback: Usuario');
    return 'Usuario';
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido de nuevo! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              {getUserDisplayName()}, aquí tienes un resumen de tu negocio
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-blue-100">Última conexión</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={`€${stats.totalVentas.toFixed(2)}`}
          icon={CurrencyEuroIcon}
          color="bg-green-500"
          trend="up"
          trendValue={`€${stats.ventasHoy.toFixed(2)} hoy`}
        />
        
        <StatCard
          title="Productos en Stock"
          value={stats.productosStock}
          icon={CubeIcon}
          color="bg-blue-500"
          trend="up"
          trendValue={`${stats.totalProductos} total`}
        />
        
        <StatCard
          title="Ventas Realizadas"
          value={stats.productosVendidos}
          icon={ShoppingCartIcon}
          color="bg-purple-500"
          trend="up"
          trendValue="Productos vendidos"
        />
        
        <StatCard
          title="Facturas Registradas"
          value={stats.totalFacturas}
          icon={DocumentTextIcon}
          color="bg-orange-500"
          trend="up"
          trendValue={`${stats.facturasHoy} hoy`}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {stats.ventasRecientes.length > 0 ? (
              stats.ventasRecientes.map((venta, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Venta #{venta.numeroVenta || `V-${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      €{venta.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {venta.productos?.length || 0} productos
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay ventas recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          
          <div className="space-y-3">
            <a
              href="/dashboard/tpv"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <ShoppingCartIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-700">
                  Nueva Venta
                </p>
                <p className="text-sm text-gray-600">
                  Procesar venta en el TPV
                </p>
              </div>
            </a>

            <a
              href="/dashboard/productos"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <CubeIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 group-hover:text-green-700">
                  Gestionar Productos
                </p>
                <p className="text-sm text-gray-600">
                  Añadir o editar productos
                </p>
              </div>
            </a>

            <a
              href="/dashboard/facturas"
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 group-hover:text-purple-700">
                  Nueva Factura
                </p>
                <p className="text-sm text-gray-600">
                  Registrar factura de proveedor
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
