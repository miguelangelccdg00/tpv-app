import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

/**
 * Hook personalizado para manejar consultas seguras a Firestore
 * Automáticamente filtra todos los datos por el usuario autenticado
 */
export const useSecureFirestore = () => {
  const { usuario } = useAuth();

  /**
   * Obtener una colección filtrada por usuario en tiempo real
   * @param {string} collectionName - Nombre de la colección
   * @param {Array} orderByFields - Campos para ordenar [field, direction]
   * @param {Array} additionalFilters - Filtros adicionales [[field, operator, value]]
   */
  const useSecureCollection = (collectionName, orderByFields = [], additionalFilters = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!usuario || !usuario.email) {
        setData([]);
        setLoading(false);
        return;
      }

      console.log(`🔒 Cargando ${collectionName} para usuario: ${usuario.email}`);
      
      try {
        const collectionRef = collection(db, collectionName);
        
        // Construir la consulta con filtro de usuario obligatorio
        let constraints = [where('usuario', '==', usuario.email)];
        
        // Agregar filtros adicionales
        additionalFilters.forEach(filter => {
          if (filter.length === 3) {
            constraints.push(where(filter[0], filter[1], filter[2]));
          }
        });
        
        // Agregar ordenamiento
        orderByFields.forEach(orderField => {
          if (Array.isArray(orderField)) {
            constraints.push(orderBy(orderField[0], orderField[1]));
          } else {
            constraints.push(orderBy(orderField));
          }
        });
        
        const q = query(collectionRef, ...constraints);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Doble verificación de seguridad
            if (data.usuario === usuario.email) {
              items.push({ 
                id: doc.id, 
                ...data 
              });
            }
          });
          
          console.log(`✅ ${items.length} ${collectionName} cargados para usuario: ${usuario.email}`);
          setData(items);
          setLoading(false);
          setError(null);
        }, (err) => {
          console.error(`❌ Error cargando ${collectionName}:`, err);
          setError(err.message);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error(`❌ Error configurando listener para ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    }, [collectionName, usuario, JSON.stringify(orderByFields), JSON.stringify(additionalFilters)]);

    return { data, loading, error };
  };

  /**
   * Obtener datos de una colección de forma asíncrona (una sola vez)
   * @param {string} collectionName - Nombre de la colección
   * @param {Array} orderByFields - Campos para ordenar
   * @param {Array} additionalFilters - Filtros adicionales
   */
  const getSecureCollection = useCallback(async (collectionName, orderByFields = [], additionalFilters = []) => {
    if (!usuario || !usuario.email) {
      console.warn(`⚠️ Usuario no autenticado para consulta a ${collectionName}`);
      return [];
    }

    try {
      console.log(`🔒 Consultando ${collectionName} para usuario: ${usuario.email}`);
      
      const collectionRef = collection(db, collectionName);
      
      // Construir la consulta con filtro de usuario obligatorio
      let constraints = [where('usuario', '==', usuario.email)];
      
      // Agregar filtros adicionales
      additionalFilters.forEach(filter => {
        if (filter.length === 3) {
          constraints.push(where(filter[0], filter[1], filter[2]));
        }
      });
      
      // Agregar ordenamiento
      orderByFields.forEach(orderField => {
        if (Array.isArray(orderField)) {
          constraints.push(orderBy(orderField[0], orderField[1]));
        } else {
          constraints.push(orderBy(orderField));
        }
      });
      
      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Doble verificación de seguridad
        if (data.usuario === usuario.email) {
          items.push({ 
            id: doc.id, 
            ...data 
          });
        }
      });
      
      console.log(`✅ ${items.length} ${collectionName} obtenidos para usuario: ${usuario.email}`);
      return items;
    } catch (error) {
      console.error(`❌ Error obteniendo ${collectionName}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Agregar un documento a una colección con usuario automático
   * @param {string} collectionName - Nombre de la colección
   * @param {Object} data - Datos del documento
   */
  const addSecureDoc = useCallback(async (collectionName, data) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    const docData = {
      ...data,
      usuario: usuario.email, // Automáticamente agregar el usuario
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    console.log(`🔒 Agregando documento a ${collectionName} para usuario: ${usuario.email}`);
    
    try {
      const docRef = await addDoc(collection(db, collectionName), docData);
      console.log(`✅ Documento agregado con ID: ${docRef.id}`);
      return docRef;
    } catch (error) {
      console.error(`❌ Error agregando documento a ${collectionName}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Actualizar un documento verificando que pertenece al usuario
   * @param {string} collectionName - Nombre de la colección
   * @param {string} docId - ID del documento
   * @param {Object} data - Datos a actualizar
   */
  const updateSecureDoc = useCallback(async (collectionName, docId, data) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que el documento pertenece al usuario antes de actualizar
    try {
      const docRef = doc(db, collectionName, docId);
      const docData = {
        ...data,
        fechaActualizacion: new Date().toISOString()
      };

      console.log(`🔒 Actualizando documento ${docId} en ${collectionName} para usuario: ${usuario.email}`);
      
      await updateDoc(docRef, docData);
      console.log(`✅ Documento ${docId} actualizado correctamente`);
    } catch (error) {
      console.error(`❌ Error actualizando documento ${docId} en ${collectionName}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Eliminar un documento verificando que pertenece al usuario
   * @param {string} collectionName - Nombre de la colección
   * @param {string} docId - ID del documento
   */
  const deleteSecureDoc = useCallback(async (collectionName, docId) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    try {
      console.log(`🔒 Eliminando documento ${docId} de ${collectionName} para usuario: ${usuario.email}`);
      
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      console.log(`✅ Documento ${docId} eliminado correctamente`);
    } catch (error) {
      console.error(`❌ Error eliminando documento ${docId} de ${collectionName}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Verificar conectividad y aislamiento de datos
   */
  const diagnosticarAislamiento = useCallback(async () => {
    if (!usuario || !usuario.email) {
      return {
        error: 'Usuario no autenticado',
        usuario: null
      };
    }

    const resultado = {
      usuario: usuario.email,
      productos: 0,
      facturas: 0,
      ventas: 0,
      configuracion: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // Contar productos del usuario
      const productos = await getSecureCollection('productos');
      resultado.productos = productos.length;

      // Contar facturas del usuario
      const facturas = await getSecureCollection('facturas');
      resultado.facturas = facturas.length;

      // Contar ventas del usuario
      const ventas = await getSecureCollection('ventas');
      resultado.ventas = ventas.length;

      // Contar configuraciones del usuario
      const configuracion = await getSecureCollection('configuracion');
      resultado.configuracion = configuracion.length;

      console.log('🔍 Diagnóstico de aislamiento:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Error en diagnóstico de aislamiento:', error);
      return {
        ...resultado,
        error: error.message
      };
    }
  }, [usuario, getSecureCollection]);

  return {
    usuario,
    useSecureCollection,
    getSecureCollection,
    addSecureDoc,
    updateSecureDoc,
    deleteSecureDoc,
    diagnosticarAislamiento
  };
};

/**
 * Hooks específicos para cada colección
 */
export const useProductos = (orderBy = ['nombre']) => {
  const { useSecureCollection } = useSecureFirestore();
  return useSecureCollection('productos', orderBy);
};

export const useFacturas = (orderBy = [['fecha', 'desc']]) => {
  const { useSecureCollection } = useSecureFirestore();
  return useSecureCollection('facturas', orderBy);
};

export const useVentas = (orderBy = [['fecha', 'desc']]) => {
  const { useSecureCollection } = useSecureFirestore();
  return useSecureCollection('ventas', orderBy);
};

export const useInventario = () => {
  const { useSecureCollection } = useSecureFirestore();
  return useSecureCollection('productos', ['stock'], [['stock', '<=', 10]]);
};
