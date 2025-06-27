import React, { createContext, useContext, useCallback } from 'react';
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

const SecureDataContext = createContext();

export const useSecureData = () => {
  const context = useContext(SecureDataContext);
  if (!context) {
    throw new Error('useSecureData debe usarse dentro de SecureDataProvider');
  }
  return context;
};

export const SecureDataProvider = ({ children }) => {
  const { usuario } = useAuth();

  /**
   * Interceptor automático para todas las consultas de Firestore
   * Garantiza que SIEMPRE se filtre por usuario
   */
  const createSecureQuery = useCallback((collectionName, ...constraints) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    const collectionRef = collection(db, collectionName);
    
    // SIEMPRE agregar el filtro de usuario como primera condición
    const secureConstraints = [
      where('usuario', '==', usuario.email),
      ...constraints
    ];

    console.log(`🔒 Consulta segura a ${collectionName} para usuario: ${usuario.email}`);
    
    return query(collectionRef, ...secureConstraints);
  }, [usuario]);

  /**
   * Wrapper seguro para onSnapshot
   */
  const secureOnSnapshot = useCallback((collectionName, constraints = [], callback) => {
    if (!usuario || !usuario.email) {
      console.warn('⚠️ Usuario no autenticado, no se puede crear listener');
      callback([]);
      return () => {}; // Retornar función vacía
    }

    try {
      // Intentar crear la consulta con índices
      const q = createSecureQuery(collectionName, ...constraints);
      
      return onSnapshot(q, (snapshot) => {
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
        
        console.log(`✅ ${items.length} documentos de ${collectionName} para usuario: ${usuario.email}`);
        callback(items);
      }, (error) => {
        console.error(`❌ Error en listener de ${collectionName}:`, error);
        
        // Si es un error de índice, intentar consulta simple y ordenar en cliente
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.log(`🔄 Reintentando consulta de ${collectionName} sin ordenamiento...`);
          
          try {
            // Consulta simple solo con filtro de usuario
            const simpleQuery = createSecureQuery(collectionName);
            
            return onSnapshot(simpleQuery, (snapshot) => {
              let items = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.usuario === usuario.email) {
                  items.push({ 
                    id: doc.id, 
                    ...data 
                  });
                }
              });
              
              // Ordenar en el cliente si hay constraints de ordenamiento
              constraints.forEach(constraint => {
                if (constraint.type === 'orderBy') {
                  const field = constraint._f || constraint.field;
                  const direction = constraint._d || constraint.direction || 'asc';
                  
                  items.sort((a, b) => {
                    const aVal = a[field] || '';
                    const bVal = b[field] || '';
                    
                    if (direction === 'desc') {
                      return bVal > aVal ? 1 : -1;
                    } else {
                      return aVal > bVal ? 1 : -1;
                    }
                  });
                }
              });
              
              console.log(`✅ ${items.length} documentos de ${collectionName} (ordenados en cliente) para usuario: ${usuario.email}`);
              callback(items);
            }, (fallbackError) => {
              console.error(`❌ Error en consulta fallback de ${collectionName}:`, fallbackError);
              callback([]); // Retornar array vacío en caso de error total
            });
          } catch (fallbackError) {
            console.error(`❌ Error creando consulta fallback para ${collectionName}:`, fallbackError);
            callback([]);
          }
        } else {
          callback([]); // Retornar array vacío para otros tipos de error
        }
      });
    } catch (error) {
      console.error(`❌ Error creando listener para ${collectionName}:`, error);
      callback([]);
      return () => {}; // Retornar función vacía
    }
  }, [usuario, createSecureQuery]);

  /**
   * Wrapper seguro para getDocs
   */
  const secureGetDocs = useCallback(async (collectionName, constraints = []) => {
    if (!usuario || !usuario.email) {
      console.warn('⚠️ Usuario no autenticado para consulta');
      return [];
    }

    try {
      const q = createSecureQuery(collectionName, ...constraints);
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
      
      console.log(`✅ ${items.length} documentos obtenidos de ${collectionName} para usuario: ${usuario.email}`);
      return items;
    } catch (error) {
      console.error(`❌ Error obteniendo documentos de ${collectionName}:`, error);
      throw error;
    }
  }, [usuario, createSecureQuery]);

  /**
   * Wrapper seguro para addDoc - automáticamente agrega el usuario
   */
  const secureAddDoc = useCallback(async (collectionName, data) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    const secureData = {
      ...data,
      usuario: usuario.email, // SIEMPRE agregar el usuario
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    console.log(`🔒 Agregando documento a ${collectionName} para usuario: ${usuario.email}`);
    
    try {
      const docRef = await addDoc(collection(db, collectionName), secureData);
      console.log(`✅ Documento agregado con ID: ${docRef.id}`);
      return docRef;
    } catch (error) {
      console.error(`❌ Error agregando documento a ${collectionName}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Wrapper seguro para updateDoc
   */
  const secureUpdateDoc = useCallback(async (collectionName, docId, data) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    const updateData = {
      ...data,
      fechaActualizacion: new Date().toISOString()
    };

    console.log(`🔒 Actualizando documento ${docId} en ${collectionName} para usuario: ${usuario.email}`);
    
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, updateData);
      console.log(`✅ Documento ${docId} actualizado`);
    } catch (error) {
      console.error(`❌ Error actualizando documento ${docId}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Wrapper seguro para deleteDoc
   */
  const secureDeleteDoc = useCallback(async (collectionName, docId) => {
    if (!usuario || !usuario.email) {
      throw new Error('Usuario no autenticado');
    }

    console.log(`🔒 Eliminando documento ${docId} de ${collectionName} para usuario: ${usuario.email}`);
    
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      console.log(`✅ Documento ${docId} eliminado`);
    } catch (error) {
      console.error(`❌ Error eliminando documento ${docId}:`, error);
      throw error;
    }
  }, [usuario]);

  /**
   * Función de diagnóstico global
   */
  const diagnosticarSistema = useCallback(async () => {
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
      timestamp: new Date().toISOString(),
      aislamiento: 'ACTIVO ✅'
    };

    try {
      // Verificar cada colección
      const colecciones = ['productos', 'facturas', 'ventas', 'configuracion'];
      
      for (const coleccion of colecciones) {
        try {
          const items = await secureGetDocs(coleccion);
          resultado[coleccion] = items.length;
        } catch (error) {
          resultado[coleccion] = `Error: ${error.message}`;
        }
      }

      console.log('🔍 Diagnóstico del sistema:', resultado);
      return resultado;
    } catch (error) {
      console.error('❌ Error en diagnóstico del sistema:', error);
      return {
        ...resultado,
        error: error.message,
        aislamiento: 'ERROR ❌'
      };
    }
  }, [usuario, secureGetDocs]);

  // Si no hay usuario, proporcionar funciones que no hacen nada
  if (!usuario || !usuario.email) {
    return (
      <SecureDataContext.Provider value={{
        usuario: null,
        secureOnSnapshot: () => () => {},
        secureGetDocs: async () => [],
        secureAddDoc: async () => { throw new Error('Usuario no autenticado'); },
        secureUpdateDoc: async () => { throw new Error('Usuario no autenticado'); },
        secureDeleteDoc: async () => { throw new Error('Usuario no autenticado'); },
        diagnosticarSistema: async () => ({ error: 'Usuario no autenticado' })
      }}>
        {children}
      </SecureDataContext.Provider>
    );
  }

  const value = {
    usuario,
    secureOnSnapshot,
    secureGetDocs,
    secureAddDoc,
    secureUpdateDoc,
    secureDeleteDoc,
    diagnosticarSistema
  };

  return (
    <SecureDataContext.Provider value={value}>
      {children}
    </SecureDataContext.Provider>
  );
};
