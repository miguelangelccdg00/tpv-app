import { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ComputerDesktopIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PlayIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const AyudaPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Categorías de ayuda
  const categorias = [
    { id: 'general', name: 'General', icon: InformationCircleIcon, color: 'blue' },
    { id: 'tpv', name: 'Punto de Venta', icon: ComputerDesktopIcon, color: 'green' },
    { id: 'productos', name: 'Productos', icon: BookOpenIcon, color: 'purple' },
    { id: 'ventas', name: 'Ventas', icon: ChartBarIcon, color: 'orange' },
    { id: 'configuracion', name: 'Configuración', icon: Cog6ToothIcon, color: 'red' },
    { id: 'seguridad', name: 'Seguridad', icon: ShieldCheckIcon, color: 'indigo' }
  ];

  // Preguntas frecuentes organizadas por categoría
  const faqData = {
    general: [
      {
        id: 1,
        question: "¿Cómo empiezo a usar el sistema TPV?",
        answer: "Para comenzar, inicia sesión con tu cuenta y dirígete al Dashboard. Desde ahí puedes acceder a todas las funciones: gestionar productos, procesar ventas, ver reportes y configurar tu sistema. Te recomendamos comenzar configurando tu información de empresa y agregando algunos productos."
      },
      {
        id: 2,
        question: "¿Qué navegadores son compatibles?",
        answer: "El sistema TPV es compatible con los navegadores más modernos: Chrome (recomendado), Firefox, Safari y Edge. Para una mejor experiencia, asegúrate de tener la versión más reciente de tu navegador."
      },
      {
        id: 3,
        question: "¿Puedo usar el sistema en tablets y móviles?",
        answer: "Sí, el sistema está optimizado para dispositivos móviles y tablets. Funciona perfectamente en pantallas táctiles, lo que lo hace ideal para puntos de venta móviles."
      },
      {
        id: 4,
        question: "¿Los datos están seguros en la nube?",
        answer: "Absolutamente. Utilizamos Firebase de Google para almacenar tus datos, que cuenta con encriptación de nivel empresarial y copias de seguridad automáticas. Tus datos están protegidos con los más altos estándares de seguridad."
      }
    ],
    tpv: [
      {
        id: 1,
        question: "¿Cómo proceso una venta?",
        answer: "Ve a la sección 'Punto de Venta', busca productos escribiendo su nombre o escaneando el código de barras, agrega las cantidades deseadas al carrito y procesa el pago. El sistema calculará automáticamente impuestos y totales."
      },
      {
        id: 2,
        question: "¿Puedo aplicar descuentos?",
        answer: "Sí, puedes aplicar descuentos tanto por porcentaje como por cantidad fija. También puedes configurar productos con precios de oferta estableciendo un 'precio original' mayor al precio actual."
      },
      {
        id: 3,
        question: "¿Cómo manejo devoluciones?",
        answer: "Las devoluciones se pueden procesar desde el histórico de ventas. Busca la venta original y selecciona los productos a devolver. El sistema ajustará automáticamente el inventario."
      },
      {
        id: 4,
        question: "¿Puedo usar códigos de barras?",
        answer: "Sí, el sistema es totalmente compatible con códigos de barras. Puedes usar cualquier lector de códigos de barras USB o la cámara del dispositivo para escanear productos."
      }
    ],
    productos: [
      {
        id: 1,
        question: "¿Cómo agrego productos al catálogo?",
        answer: "Ve a la sección 'Productos' y haz clic en 'Nuevo Producto'. Completa la información requerida: código de barras, nombre, precios y stock. El sistema calculará automáticamente márgenes de beneficio."
      },
      {
        id: 2,
        question: "¿Puedo importar productos masivamente?",
        answer: "Actualmente el sistema permite agregar productos individualmente. Para importación masiva, contacta al soporte técnico para obtener herramientas especializadas."
      },
      {
        id: 3,
        question: "¿Cómo gestiono el inventario?",
        answer: "El inventario se actualiza automáticamente con cada venta. También puedes hacer ajustes manuales desde la sección 'Inventario' para correcciones, mermas o nuevas entradas de stock."
      },
      {
        id: 4,
        question: "¿Puedo organizar productos por categorías?",
        answer: "Sí, puedes asignar categorías a cada producto para organizarlos mejor. Esto también te ayudará a generar reportes por categoría y encontrar productos más rápidamente."
      }
    ],
    ventas: [
      {
        id: 1,
        question: "¿Dónde veo mis reportes de ventas?",
        answer: "En la sección 'Ventas' encontrarás reportes detallados por día, semana, mes y año. Puedes ver gráficos de rendimiento, productos más vendidos y análisis de beneficios."
      },
      {
        id: 2,
        question: "¿Puedo exportar los reportes?",
        answer: "Sí, todos los reportes se pueden exportar en formato PDF o Excel para tu contabilidad o análisis externo."
      },
      {
        id: 3,
        question: "¿Cómo veo el histórico de ventas?",
        answer: "En la sección 'Ventas' tienes acceso completo al histórico. Puedes filtrar por fechas, productos, métodos de pago y buscar ventas específicas."
      }
    ],
    configuracion: [
      {
        id: 1,
        question: "¿Cómo configuro la información de mi empresa?",
        answer: "Ve a 'Configuración' y completa los datos de tu empresa: nombre, dirección, teléfono, email y datos fiscales. Esta información aparecerá en recibos y facturas."
      },
      {
        id: 2,
        question: "¿Puedo personalizar los recibos?",
        answer: "Sí, puedes personalizar el diseño de los recibos, agregar tu logo, cambiar colores y incluir mensajes personalizados o promociones."
      },
      {
        id: 3,
        question: "¿Cómo configuro los impuestos?",
        answer: "En la configuración puedes establecer diferentes tipos de IVA y impuestos. El sistema calculará automáticamente los impuestos según la configuración de cada producto."
      }
    ],
    seguridad: [
      {
        id: 1,
        question: "¿Cómo cambio mi contraseña?",
        answer: "Ve a 'Mi Perfil' en el menú de usuario y selecciona 'Cambiar contraseña'. Introduce tu contraseña actual y la nueva contraseña dos veces para confirmar."
      },
      {
        id: 2,
        question: "¿Puedo tener múltiples usuarios?",
        answer: "La versión actual está diseñada para un usuario por negocio. Para funciones multiusuario, contacta al soporte para opciones empresariales."
      },
      {
        id: 3,
        question: "¿Qué pasa si olvido mi contraseña?",
        answer: "En la pantalla de login, usa la opción 'Olvidé mi contraseña' para recibir un enlace de recuperación en tu email registrado."
      }
    ]
  };

  // Guías rápidas
  const guiasRapidas = [
    {
      title: "Configuración Inicial",
      description: "Configura tu sistema TPV en 5 minutos",
      icon: Cog6ToothIcon,
      color: "blue",
      steps: [
        "Completa la información de tu empresa",
        "Agrega tu primer producto",
        "Configura métodos de pago",
        "Personaliza recibos",
        "¡Realiza tu primera venta!"
      ]
    },
    {
      title: "Primera Venta",
      description: "Aprende a procesar ventas rápidamente",
      icon: CreditCardIcon,
      color: "green",
      steps: [
        "Ve al Punto de Venta",
        "Busca productos por nombre o código",
        "Agrega al carrito",
        "Selecciona método de pago",
        "Confirma la venta"
      ]
    },
    {
      title: "Gestión de Productos",
      description: "Organiza tu catálogo eficientemente",
      icon: BookOpenIcon,
      color: "purple",
      steps: [
        "Accede a la sección Productos",
        "Haz clic en 'Nuevo Producto'",
        "Completa información básica",
        "Establece precios y stock",
        "Asigna categorías"
      ]
    }
  ];

  // Videos tutoriales (simulados)
  const videosTutoriales = [
    {
      title: "Introducción al Sistema TPV",
      duration: "5:32",
      thumbnail: "🎥",
      description: "Conoce las funciones principales del sistema"
    },
    {
      title: "Configuración Inicial",
      duration: "8:15",
      thumbnail: "⚙️",
      description: "Configura tu negocio paso a paso"
    },
    {
      title: "Gestión de Productos",
      duration: "6:48",
      thumbnail: "📦",
      description: "Aprende a gestionar tu inventario"
    },
    {
      title: "Procesamiento de Ventas",
      duration: "4:23",
      thumbnail: "💳",
      description: "Cómo procesar ventas eficientemente"
    }
  ];

  // Filtrar FAQs según búsqueda
  const faqsFiltradas = faqData[activeCategory]?.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 text-blue-700 bg-blue-50 border-blue-200',
      green: 'from-green-500 to-green-600 text-green-700 bg-green-50 border-green-200',
      purple: 'from-purple-500 to-purple-600 text-purple-700 bg-purple-50 border-purple-200',
      orange: 'from-orange-500 to-orange-600 text-orange-700 bg-orange-50 border-orange-200',
      red: 'from-red-500 to-red-600 text-red-700 bg-red-50 border-red-200',
      indigo: 'from-indigo-500 to-indigo-600 text-indigo-700 bg-indigo-50 border-indigo-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <QuestionMarkCircleIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Centro de Ayuda
              </h1>
              <p className="text-lg text-slate-600 mt-2">
                Encuentra respuestas rápidas y aprende a usar tu sistema TPV al máximo
              </p>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">
                <MagnifyingGlassIcon className="h-6 w-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Busca tu pregunta aquí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Acceso Rápido */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <LightBulbIcon className="h-7 w-7 text-amber-500 mr-3" />
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button className="group p-6 backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <VideoCameraIcon className="h-8 w-8 text-red-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-bold text-slate-800 mb-1">Video Tutoriales</h3>
              <p className="text-sm text-slate-600">Aprende visualmente</p>
            </button>
            
            <button className="group p-6 backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-bold text-slate-800 mb-1">Chat en Vivo</h3>
              <p className="text-sm text-slate-600">Soporte inmediato</p>
            </button>
            
            <button className="group p-6 backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <PhoneIcon className="h-8 w-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-bold text-slate-800 mb-1">Llamada</h3>
              <p className="text-sm text-slate-600">+34 900 123 456</p>
            </button>
            
            <button className="group p-6 backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <EnvelopeIcon className="h-8 w-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-bold text-slate-800 mb-1">Email</h3>
              <p className="text-sm text-slate-600">soporte@tpv.com</p>
            </button>
          </div>
        </div>

        {/* Guías Rápidas */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <AcademicCapIcon className="h-7 w-7 text-emerald-500 mr-3" />
            Guías Rápidas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {guiasRapidas.map((guia, index) => {
              const Icon = guia.icon;
              return (
                <div key={index} className="backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${getColorClasses(guia.color).split(' ')[0]} ${getColorClasses(guia.color).split(' ')[1]} flex items-center justify-center mr-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{guia.title}</h3>
                      <p className="text-sm text-slate-600">{guia.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {guia.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-center text-sm text-slate-700">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mr-3 text-xs font-bold text-slate-600">
                          {stepIndex + 1}
                        </div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Videos Tutoriales */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <VideoCameraIcon className="h-7 w-7 text-red-500 mr-3" />
            Videos Tutoriales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videosTutoriales.map((video, index) => (
              <div key={index} className="group backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-4xl">{video.thumbnail}</div>
                  <button className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlayIcon className="h-8 w-8 text-white" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 mb-1">{video.title}</h3>
                  <p className="text-sm text-slate-600">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorías de FAQ */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <BookOpenIcon className="h-7 w-7 text-blue-500 mr-3" />
            Preguntas Frecuentes
          </h2>
          
          {/* Tabs de categorías */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categorias.map((categoria) => {
              const Icon = categoria.icon;
              const isActive = activeCategory === categoria.id;
              return (
                <button
                  key={categoria.id}
                  onClick={() => setActiveCategory(categoria.id)}
                  className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${getColorClasses(categoria.color).split(' ')[0]} ${getColorClasses(categoria.color).split(' ')[1]} text-white shadow-lg`
                      : 'bg-white/60 text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {categoria.name}
                </button>
              );
            })}
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            {faqsFiltradas.length > 0 ? (
              faqsFiltradas.map((faq) => (
                <div key={faq.id} className="backdrop-blur-sm bg-white/80 border border-white/30 rounded-2xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-6 text-left hover:bg-white/50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800 pr-4">{faq.question}</h3>
                      <ChevronDownIcon 
                        className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${
                          expandedFAQ === faq.id ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-6">
                      <div className="border-l-4 border-blue-400 pl-4 bg-blue-50/80 p-4 rounded-r-lg">
                        <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No se encontraron preguntas</h3>
                <p className="text-slate-600">Intenta con otros términos de búsqueda o selecciona otra categoría.</p>
              </div>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">¿No encontraste lo que buscabas?</h2>
            <p className="text-slate-600 mb-6">
              Nuestro equipo de soporte está aquí para ayudarte. Contáctanos y resolveremos tus dudas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2 group-hover:scale-110 transition-transform duration-200" />
                Iniciar Chat
              </button>
              <button className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <EnvelopeIcon className="h-5 w-5 inline mr-2 group-hover:scale-110 transition-transform duration-200" />
                Enviar Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AyudaPage;
