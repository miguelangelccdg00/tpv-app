# Mejoras del Algoritmo de Similitud de Productos

## Problema Identificado

El sistema anterior asignaba incorrectamente productos por similitud superficial. Por ejemplo:
- **Aquarius Naranja** se asignaba a **Fanta Naranja** solo porque ambos contenían "Naranja"
- Productos de marcas diferentes con sabores similares se confundían
- El umbral del 80% permitía asignaciones incorrectas

## Soluciones Implementadas

### 1. Reglas de Exclusión Estrictas

#### Marcas Diferentes = 0% Similitud
```javascript
// Si las marcas son diferentes y ambas están definidas, similitud = 0
if (carac1.marca && carac2.marca && carac1.marca !== carac2.marca) {
  return 0;
}
```

**Ejemplo:**
- `Fanta Naranja` vs `Aquarius Naranja` = **0% similitud**
- `Coca-Cola` vs `Pepsi Cola` = **0% similitud**

#### Sabores Diferentes = Máximo 15% Similitud
```javascript
// Si los sabores son diferentes y ambos están definidos, similitud muy baja
if (carac1.sabor && carac2.sabor && carac1.sabor !== carac2.sabor) {
  return 15; // Máximo 15%
}
```

### 2. Mejora en la Detección de Características

#### Marcas Ampliadas
```javascript
const marcas = [
  'coca-cola', 'coca cola', 'fanta', 'sprite', 'aquarius', 'pepsi', 'mirinda', 
  'seven up', '7up', 'nestea', 'redbull', 'red bull', 'monster', 'schweppes',
  'trina', 'kas', 'lemon', 'tropicana', 'don simon', 'granini', 'coca'
];
```

#### Sabores Extendidos
```javascript
const sabores = [
  'naranja', 'limón', 'limon', 'lima', 'cereza', 'uva', 'manzana', 'piña', 'pina',
  'original', 'clásico', 'clasico', 'melocotón', 'melocoton', 'fresa', 'tropical',
  'sin azúcar', 'zero', 'light', 'diet'
];
```

### 3. Sistema de Puntuación Reestructurado

| Característica | Peso | Anterior | Nuevo |
|---------------|------|----------|-------|
| Marca | 35% | 30% | Crítico (0% si diferente) |
| Sabor | 30% | 25% | Crítico (15% máx si diferente) |
| Tamaño | 20% | 20% | Igual |
| Tipo envase | 10% | 15% | Reducido |
| Palabras comunes | 5% | 10% | Muy reducido |

### 4. Umbral de Confianza Aumentado

- **Anterior:** 80% mínimo para asignación automática
- **Nuevo:** 85% mínimo para asignación automática
- **Búsqueda manual:** 40% mínimo (anteriormente 30%)

### 5. Logging Detallado

```javascript
console.log('🔍 Comparando características:');
console.log('  Producto 1:', carac1);
console.log('  Producto 2:', carac2);

if (carac1.marca && carac2.marca && carac1.marca !== carac2.marca) {
  console.log('❌ MARCAS DIFERENTES - similitud = 0%');
  console.log(`  "${carac1.marca}" ≠ "${carac2.marca}"`);
  return 0;
}
```

### 6. UI Mejorada

#### Indicadores de Confianza
- **Verde (95%+):** Asignación muy confiable
- **Amarillo (90-94%):** Asignación confiable  
- **Naranja (<90%):** Revisar asignación

#### Mensajes de Alerta
- ⚠️ Revisa esta asignación - confianza media/baja
- Información sobre el nuevo sistema en la interfaz

## Casos de Prueba

### Caso 1: Marcas Diferentes, Mismo Sabor
- **Producto extraído:** "Aquarius Naranja Botella 500ml"
- **Producto existente:** "Fanta Naranja Lata 330ml"
- **Resultado anterior:** ~40-50% similitud (posible asignación incorrecta)
- **Resultado nuevo:** 0% similitud (no se asigna)

### Caso 2: Misma Marca, Mismo Sabor
- **Producto extraído:** "Fanta Naranja Lata 330ml"
- **Producto existente:** "Fanta Naranja Lata 330ml"
- **Resultado:** 100% similitud (asignación correcta)

### Caso 3: Misma Marca, Sabor Diferente
- **Producto extraído:** "Fanta Limón Lata 330ml"
- **Producto existente:** "Fanta Naranja Lata 330ml"
- **Resultado:** Máximo 15% similitud (no se asigna)

## Beneficios

1. **Eliminación de falsos positivos:** No más asignaciones de Aquarius a Fanta
2. **Mayor precisión:** Solo asignaciones con alta confianza
3. **Transparencia:** Logs detallados para debugging
4. **Flexibilidad:** Búsqueda manual con scores informativos
5. **Robustez:** Sistema más estable y predecible

## Archivos Modificados

- `EditorProductosExtraidos_nuevo.jsx` - Algoritmo principal mejorado
- `AnalizadorFacturas.jsx` - Actualizado para usar nuevo editor
- `FacturasPage.jsx` - Ejemplo mejorado con casos problemáticos
- `MEJORAS_ALGORITMO_SIMILITUD.md` - Esta documentación

## Próximos Pasos

1. Probar con datos reales para validar mejoras
2. Ajustar umbrales si es necesario
3. Añadir más marcas y características según necesidades
4. Implementar tests automáticos para el algoritmo
5. Considerar machine learning para mejoras futuras
