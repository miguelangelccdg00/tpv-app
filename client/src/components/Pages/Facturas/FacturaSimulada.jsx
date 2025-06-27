import React from 'react';

const FacturaSimulada = ({ mostrar, onCerrar }) => {
  if (!mostrar) return null;

  const facturaData = {
    numeroFactura: 'FAC-2025-157',
    fecha: '27/06/2025',
    fechaVencimiento: '27/07/2025',
    proveedor: {
      nombre: 'Coca-Cola Iberian Partners S.L.',
      direccion: 'Avenida de Burgos, 12',
      ciudad: '28036 Madrid',
      telefono: '+34 91 123 45 67',
      email: 'ventas@cocacola-ep.com',
      cif: 'A-12345678'
    },
    cliente: {
      nombre: 'TPV Sistema - Tu Negocio',
      direccion: 'Calle Principal, 123',
      ciudad: '28001 Madrid',
      telefono: '+34 91 987 65 43',
      cif: 'B-87654321'
    },
    productos: [
      {
        codigo: '123456789123',
        descripcion: 'Coca-Cola Original Lata 330ml',
        cantidad: 24,
        precioUnitario: 1.20, // Precio de compra
        descuento: 0,
        iva: 21,
        total: 28.80
      },
      {
        codigo: '123456789124',
        descripcion: 'Fanta Naranja Lata 330ml',
        cantidad: 12,
        precioUnitario: 0.60, // Precio de compra
        descuento: 0,
        iva: 21,
        total: 7.20
      },
      {
        codigo: '123456789125',
        descripcion: 'Sprite Limón Lata 330ml',
        cantidad: 18,
        precioUnitario: 1.15, // Precio de compra
        descuento: 5,
        iva: 21,
        total: 20.70
      },
      {
        codigo: '123456789126',
        descripcion: 'Aquarius Naranja Botella 500ml',
        cantidad: 6,
        precioUnitario: 1.80, // Precio de compra
        descuento: 0,
        iva: 21,
        total: 10.80
      }
    ]
  };

  const subtotal = facturaData.productos.reduce((sum, p) => sum + p.total, 0);
  const totalIVA = subtotal * 0.21;
  const totalFactura = subtotal + totalIVA;

  const imprimirFactura = () => {
    window.print();
  };

  const descargarFactura = () => {
    // Crear un enlace temporal para descargar
    const facturaHTML = document.getElementById('factura-content').innerHTML;
    const blob = new Blob([`
      <html>
        <head>
          <title>Factura ${facturaData.numeroFactura}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { color: #d62d20; font-size: 24px; font-weight: bold; }
            .factura-info { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { background-color: #e8f4fd; font-weight: bold; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>${facturaHTML}</body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factura_${facturaData.numeroFactura}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
        {/* Botones de acción */}
        <div className="flex justify-between items-center mb-4 no-print">
          <h2 className="text-xl font-bold text-gray-900">Factura Simulada - Bebidas</h2>
          <div className="flex space-x-2">
            <button
              onClick={imprimirFactura}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={descargarFactura}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              💾 Descargar
            </button>
            <button
              onClick={onCerrar}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ❌ Cerrar
            </button>
          </div>
        </div>

        {/* Contenido de la factura */}
        <div id="factura-content" className="bg-white p-6 border-2 border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">🥤 Coca-Cola</div>
              <div className="text-lg text-gray-700">Iberian Partners S.L.</div>
              <div className="text-sm text-gray-600">
                <p>{facturaData.proveedor.direccion}</p>
                <p>{facturaData.proveedor.ciudad}</p>
                <p>Tel: {facturaData.proveedor.telefono}</p>
                <p>Email: {facturaData.proveedor.email}</p>
                <p>CIF: {facturaData.proveedor.cif}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 p-4 rounded-lg">
                <h1 className="text-2xl font-bold text-blue-800 mb-2">FACTURA</h1>
                <p className="text-lg font-semibold">Nº {facturaData.numeroFactura}</p>
                <p className="text-sm text-gray-600">Fecha: {facturaData.fecha}</p>
                <p className="text-sm text-gray-600">Vencimiento: {facturaData.fechaVencimiento}</p>
              </div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Facturar a:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{facturaData.cliente.nombre}</p>
              <p>{facturaData.cliente.direccion}</p>
              <p>{facturaData.cliente.ciudad}</p>
              <p>Tel: {facturaData.cliente.telefono}</p>
              <p>CIF: {facturaData.cliente.cif}</p>
            </div>
          </div>

          {/* Tabla de productos */}
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left">Código</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Descripción</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Cantidad</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Precio Unit.</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Dto.</th>
                <th className="border border-gray-300 px-4 py-3 text-center">IVA</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {facturaData.productos.map((producto, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-mono text-sm">{producto.codigo}</td>
                  <td className="border border-gray-300 px-4 py-3">{producto.descripcion}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{producto.cantidad}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">€{producto.precioUnitario.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{producto.descuento}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{producto.iva}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold">€{producto.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>IVA (21%):</span>
                  <span>€{totalIVA.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 mt-2 pt-2">
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>€{totalFactura.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones de pago */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Condiciones de Pago:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Pago a 30 días desde fecha de factura</li>
                  <li>• Transferencia bancaria</li>
                  <li>• IBAN: ES12 1234 5678 9012 3456 7890</li>
                  <li>• Incluir número de factura como concepto</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Condiciones de Entrega:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Entrega en 48-72 horas</li>
                  <li>• Transporte incluido (pedidos +100€)</li>
                  <li>• Horario: L-V 8:00-18:00</li>
                  <li>• Verificar productos al recibir</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Esta factura ha sido procesada electrónicamente y es válida sin firma.</p>
              <p>Coca-Cola Iberian Partners S.L. - Reg. Mercantil de Madrid - CIF: A-12345678</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturaSimulada;
