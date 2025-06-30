import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  ClockIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../AuthContext';
import { useSecureData } from '../../../contexts/SecureDataContext';
import { useNavigate } from 'react-router-dom';

export default function MiPerfil() {
  const { usuario, updateProfile } = useAuth();
  const { secureGetDocs, secureUpdateDoc, secureAddDoc } = useSecureData();
  const navigate = useNavigate();
  
  const [perfilData, setPerfilData] = useState({
    displayName: '',
    email: '',
    nombreCajero: '',
    telefono: '',
    direccion: '',
    fechaCreacion: null,
    ultimoAcceso: null
  });
  
  const [editando, setEditando] = useState({
    displayName: false,
    nombreCajero: false,
    telefono: false,
    direccion: false
  });
  
  const [guardando, setGuardando] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Cargar datos del perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!usuario?.email) return;

      try {
        // Cargar datos básicos del usuario
        setPerfilData(prev => ({
          ...prev,
          displayName: usuario.displayName || '',
          email: usuario.email,
          fechaCreacion: usuario.metadata?.creationTime ? new Date(usuario.metadata.creationTime) : null,
          ultimoAcceso: usuario.metadata?.lastSignInTime ? new Date(usuario.metadata.lastSignInTime) : null
        }));

        // Cargar configuración adicional desde Firebase
        const configuraciones = await secureGetDocs('configuracion', []);
        const configUsuario = configuraciones.find(c => c.usuarioEmail === usuario.email);
        
        if (configUsuario) {
          setPerfilData(prev => ({
            ...prev,
            nombreCajero: configUsuario.nombreCajero || '',
            telefono: configUsuario.telefono || '',
            direccion: configUsuario.direccion || ''
          }));
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };

    cargarPerfil();
  }, [usuario, secureGetDocs]);

  // Guardar cambios en el perfil
  const guardarCambios = async (campo, valor) => {
    if (!usuario?.email) return;

    setGuardando(true);
    try {
      // Si es displayName, actualizar en Firebase Auth
      if (campo === 'displayName') {
        await updateProfile({ displayName: valor });
      }

      // Guardar en configuración personalizada
      const configuraciones = await secureGetDocs('configuracion', []);
      const configUsuario = configuraciones.find(c => c.usuarioEmail === usuario.email);

      const datosActualizados = {
        usuarioEmail: usuario.email,
        [campo]: valor,
        fechaActualizacion: new Date().toISOString()
      };

      if (configUsuario) {
        await secureUpdateDoc('configuracion', configUsuario.id, datosActualizados);
      } else {
        await secureAddDoc('configuracion', datosActualizados);
      }

      // Actualizar estado local
      setPerfilData(prev => ({ ...prev, [campo]: valor }));
      setEditando(prev => ({ ...prev, [campo]: false }));

      // Actualizar localStorage también para sincronizar
      const configLocal = JSON.parse(localStorage.getItem('configImpresion') || '{}');
      configLocal[campo] = valor;
      localStorage.setItem('configImpresion', JSON.stringify(configLocal));

    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar los cambios: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Manejar subida de avatar
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 2MB permitido.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Componente para campo editable
  const CampoEditable = ({ campo, valor, tipo = 'text', placeholder, icono: Icono }) => {
    const [valorTemp, setValorTemp] = useState(valor);

    const iniciarEdicion = () => {
      setValorTemp(valor);
      setEditando(prev => ({ ...prev, [campo]: true }));
    };

    const cancelarEdicion = () => {
      setValorTemp(valor);
      setEditando(prev => ({ ...prev, [campo]: false }));
    };

    const confirmarEdicion = () => {
      if (valorTemp.trim() !== valor) {
        guardarCambios(campo, valorTemp.trim());
      } else {
        setEditando(prev => ({ ...prev, [campo]: false }));
      }
    };

    return (
      <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
        <Icono className="h-5 w-5 text-gray-400 flex-shrink-0" />
        
        {editando[campo] ? (
          <div className="flex-1 flex items-center space-x-2">
            <input
              type={tipo}
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmarEdicion();
                if (e.key === 'Escape') cancelarEdicion();
              }}
            />
            <button
              onClick={confirmarEdicion}
              disabled={guardando}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={cancelarEdicion}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-gray-900">{valor || placeholder}</span>
            <button
              onClick={iniciarEdicion}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso requerido</h3>
          <p className="mt-1 text-sm text-gray-500">
            Debes iniciar sesión para ver tu perfil.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600">Gestiona tu información personal y configuración</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/tpv')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Volver al TPV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Avatar y datos básicos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                      perfilData.displayName?.charAt(0)?.toUpperCase() || 
                      perfilData.email?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <CameraIcon className="h-5 w-5 text-gray-600" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {perfilData.displayName || 'Usuario'}
                </h2>
                <p className="text-gray-500">{perfilData.email}</p>

                {/* Información de cuenta */}
                <div className="mt-6 space-y-3">
                  {perfilData.fechaCreacion && (
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Miembro desde {perfilData.fechaCreacion.toLocaleDateString('es-ES')}
                    </div>
                  )}
                  {perfilData.ultimoAcceso && (
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      Último acceso: {perfilData.ultimoAcceso.toLocaleDateString('es-ES')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Información editable */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Información Personal</h3>
              
              <div className="space-y-4">
                <CampoEditable
                  campo="displayName"
                  valor={perfilData.displayName}
                  placeholder="Tu nombre completo"
                  icono={UserIcon}
                />
                
                <CampoEditable
                  campo="nombreCajero"
                  valor={perfilData.nombreCajero}
                  placeholder="Nombre que aparece en tickets"
                  icono={BuildingStorefrontIcon}
                />
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900">{perfilData.email}</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">No editable</span>
                </div>
                
                <CampoEditable
                  campo="telefono"
                  valor={perfilData.telefono}
                  tipo="tel"
                  placeholder="Tu número de teléfono"
                  icono={UserIcon}
                />
                
                <CampoEditable
                  campo="direccion"
                  valor={perfilData.direccion}
                  placeholder="Tu dirección"
                  icono={BuildingStorefrontIcon}
                />
              </div>

              {/* Sección de seguridad */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Seguridad</h3>
                <div className="space-y-3">
                  <button className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full text-left">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-gray-900 font-medium">Cambiar contraseña</p>
                      <p className="text-sm text-gray-500">Actualiza tu contraseña por seguridad</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/configuracion')}
                    className="flex items-center justify-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">Configuración de Tienda</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/tpv')}
                    className="flex items-center justify-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <BuildingStorefrontIcon className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">Ir al TPV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
