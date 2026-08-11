/**
 * Valida los resultados del análisis cinemático
 * @param {Object} results - Objeto con los resultados de kinematicAnalysis
 * @returns {boolean} - True si todos los valores son válidos, false si hay problemas
 */
export const validateKinematicAnalysis = (
  results,
  index1,
  index2,
  index3,
  index4,
  index5,
  index6
) => {
  // 1. Validar arrays básicos
  if (
    !results.arrayY13 ||
    !results.arrayY13T ||
    !results.velocity ||
    !results.displacement ||
    !results.instantForce ||
    !results.instantPower
  ) {
    console.error("Faltan arrays básicos en los resultados");
    return false;
  }

  if (!index1 || !index2 || !index3 || !index4 || !index5 || !index6) {
    console.error("No se encontraron uno o varios índices");
    return false;
  }

  if (Math.max(...results.velocidadPonderada) > Math.max(...results.arrayY13)) {
    console.error("Error en la captura de datos");
    return false;
  }

  // 2. Validar longitudes de arrays principales
  const baseLength = results.arrayY13.length;
  const requiredArrays = [
    results.arrayY13T,
    results.velocity,
    results.displacement,
    results.instantForce,
    results.instantPower,
  ];

  for (const arr of requiredArrays) {
    if (arr.length !== baseLength) {
      console.error("Longitud de arrays inconsistentes", {
        arrayY13: baseLength,
        otherArray: arr.length,
      });
      return false;
    }
  }

  // 3. Validar valores numéricos en arrays
  const validateArrayValues = (arr, name) => {
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== "number" || isNaN(arr[i])) {
        console.error(`Valor inválido en ${name} en índice ${i}:`, arr[i]);
        return false;
      }
    }
    return true;
  };

  if (
    !validateArrayValues(results.arrayY13, "arrayY13") ||
    !validateArrayValues(results.arrayY13T, "arrayY13T") ||
    !validateArrayValues(results.velocity, "velocity") ||
    !validateArrayValues(results.displacement, "displacement") ||
    !validateArrayValues(results.instantForce, "instantForce") ||
    !validateArrayValues(results.instantPower, "instantPower")
  ) {
    return false;
  }

  // 4. Validar fase propulsiva
  if (
    !results.propulsiveAcceleration ||
    !results.propulsiveAccTime ||
    results.propulsiveAcceleration.length !== results.propulsiveAccTime.length
  ) {
    console.error("Datos de fase propulsiva inconsistentes");
    return false;
  }

  // 5. Validar valores calculados importantes
  const criticalValues = [
    results.takeOffVelocityCalculated,
    results.tiempoPropulsivo,
    results.distanciaPropulsiva,
    results.meanPropulsiveForce,
    results.meanPropulsivePower,
  ];

  for (const val of criticalValues) {
    if (typeof val !== "number" || isNaN(val) || val <= 0) {
      console.error("Valor crítico inválido:", val);
      return false;
    }
  }

  // 6. Validar arrays filtrados
  if (
    results.propAccFiltered &&
    results.propAccFiltered.length !== results.propulsiveAcceleration.length
  ) {
    console.error("Longitud de aceleración filtrada incorrecta");
    return false;
  }

  // 7. Validar consistencia de integración
  const lastVelocity = results.velocity[results.velocity.length - 1];
  if (Math.abs(lastVelocity - results.takeOffVelocityCalculated) > 0.1) {
    console.error("Inconsistencia en velocidades finales", {
      velocityEnd: lastVelocity,
      takeOffVelocity: results.takeOffVelocityCalculated,
    });
    return false;
  }

  // 8. Validar que haya datos suficientes
  if (results.propulsiveAcceleration.length < 10) {
    console.error(
      "Datos propulsivos insuficientes:",
      results.propulsiveAcceleration.length
    );
    return false;
  }

  // Todas las validaciones pasaron
  return true;
};
