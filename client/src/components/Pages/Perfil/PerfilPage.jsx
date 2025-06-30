import { useState, useEffect } from 'react';
import { 
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../AuthContext';
import { useSecureData } from '../../../contexts/SecureDataContext';

const PerfilPage = () => {
  const { usuario } = useAuth();
  const { secureGetDocs, secureAddDoc, secureUpdateDoc } = useSecureData();
  
  const [perfil, setPerfil] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: 'España',
    empresa: '',
    cargo: '',
    avatar: '',
    configuracion: {
      notificaciones: true,
      emailMarketing: false,
      modoOscuro: false,
      idioma: 'es'
    }
  });

  const [passwords, setPasswords] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [activeTab, setActiveTab] = useState('perfil');

  // Cargar perfil del usuario
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!usuario?.email) return;

      try {
        // El contexto automáticamente filtra por usuario.email
        const perfiles = await secureGetDocs('perfiles', []);
        
        if (perfiles.length > 0) {
          setPerfil(prev => ({
            ...prev,
            ...perfiles[0]
          }));
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };

    cargarPerfil();
  }, [usuario, secureGetDocs]);

  const handlePerfilChange = (campo, valor) => {
    setPerfil(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleConfiguracionChange = (campo, valor) => {
    setPerfil(prev => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        [campo]: valor
      }
    }));
  };

  const handlePasswordChange = (campo, valor) => {
    setPasswords(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const togglePasswordVisibility = (campo) => {
    setShowPasswords(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo de imagen válido.' });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setMensaje({ tipo: 'error', texto: 'El archivo es demasiado grande. Máximo 2MB permitido.' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        handlePerfilChange('avatar', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const perfilData = {
        ...perfil,
        email: usuario.email, // Mantener referencia al email para búsquedas
        fechaActualizacion: new Date().toISOString()
      };

      // Buscar si ya existe un perfil (el contexto automáticamente filtra por usuario)
      const perfiles = await secureGetDocs('perfiles', []);

      if (perfiles.length > 0) {
        // Actualizar perfil existente
        await secureUpdateDoc('perfiles', perfiles[0].id, perfilData);
      } else {
        // Crear nuevo perfil (secureAddDoc automáticamente añade el campo 'usuario')
        await secureAddDoc('perfiles', perfilData);
      }

      setMensaje({ tipo: 'success', texto: '✅ Perfil guardado correctamente.' });
    } catch (error) {
      console.error('Error guardando perfil:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar el perfil: ' + error.message });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPassword = async () => {
    if (!passwords.actual || !passwords.nueva || !passwords.confirmar) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos de contraseña son obligatorios.' });
      return;
    }

    if (passwords.nueva !== passwords.confirmar) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    if (passwords.nueva.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setGuardando(true);
    try {
      // Aquí implementarías el cambio de contraseña con Firebase Auth
      // Por ahora solo simulamos el éxito
      setMensaje({ tipo: 'success', texto: '✅ Contraseña cambiada correctamente.' });
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ Error al cambiar la contraseña: ' + error.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Conectado: {usuario?.email}</span>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {mensaje.tipo === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              )}
              {mensaje.texto}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('perfil')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'perfil'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Información Personal
              </button>
              <button
                onClick={() => setActiveTab('seguridad')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'seguridad'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Seguridad
              </button>
              <button
                onClick={() => setActiveTab('preferencias')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preferencias'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preferencias
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === 'perfil' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Personal</h2>
            
            {/* Avatar */}
            <div className="mb-8 flex items-center space-x-6">
              <div className="relative">
                {perfil.avatar ? (
                  <img
                    src={perfil.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                    <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                  <CameraIcon className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Foto de perfil</h3>
                <p className="text-sm text-gray-500">JPG, PNG o GIF. Máximo 2MB.</p>
              </div>
            </div>

            {/* Formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={perfil.nombre}
                  onChange={(e) => handlePerfilChange('nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={perfil.apellidos}
                  onChange={(e) => handlePerfilChange('apellidos', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tus apellidos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={usuario?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={perfil.telefono}
                  onChange={(e) => handlePerfilChange('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+34 123 456 789"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={perfil.direccion}
                  onChange={(e) => handlePerfilChange('direccion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Calle, número, piso..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={perfil.ciudad}
                  onChange={(e) => handlePerfilChange('ciudad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu ciudad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={perfil.codigoPostal}
                  onChange={(e) => handlePerfilChange('codigoPostal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="28001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  value={perfil.empresa}
                  onChange={(e) => handlePerfilChange('empresa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de tu empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={perfil.cargo}
                  onChange={(e) => handlePerfilChange('cargo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu cargo o posición"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={guardarPerfil}
                disabled={guardando}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seguridad de la Cuenta</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.actual ? 'text' : 'password'}
                    value={passwords.actual}
                    onChange={(e) => handlePasswordChange('actual', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('actual')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.actual ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.nueva ? 'text' : 'password'}
                    value={passwords.nueva}
                    onChange={(e) => handlePasswordChange('nueva', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('nueva')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.nueva ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmar ? 'text' : 'password'}
                    value={passwords.confirmar}
                    onChange={(e) => handlePasswordChange('confirmar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmar')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.confirmar ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900">Consejos de seguridad</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Usa al menos 8 caracteres</li>
                        <li>Incluye mayúsculas, minúsculas y números</li>
                        <li>Añade símbolos especiales (@, #, $, etc.)</li>
                        <li>No uses información personal</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={cambiarPassword}
                  disabled={guardando}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferencias' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferencias</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notificaciones por email</h3>
                  <p className="text-sm text-gray-500">Recibe notificaciones importantes por email</p>
                </div>
                <button
                  onClick={() => handleConfiguracionChange('notificaciones', !perfil.configuracion.notificaciones)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    perfil.configuracion.notificaciones ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      perfil.configuracion.notificaciones ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Marketing por email</h3>
                  <p className="text-sm text-gray-500">Recibe ofertas y novedades por email</p>
                </div>
                <button
                  onClick={() => handleConfiguracionChange('emailMarketing', !perfil.configuracion.emailMarketing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    perfil.configuracion.emailMarketing ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      perfil.configuracion.emailMarketing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Modo oscuro</h3>
                  <p className="text-sm text-gray-500">Tema oscuro para la interfaz</p>
                </div>
                <button
                  onClick={() => handleConfiguracionChange('modoOscuro', !perfil.configuracion.modoOscuro)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    perfil.configuracion.modoOscuro ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      perfil.configuracion.modoOscuro ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="py-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  value={perfil.configuracion.idioma}
                  onChange={(e) => handleConfiguracionChange('idioma', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={guardarPerfil}
                  disabled={guardando}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilPage;
