import { indiceDelMinimoHasta } from "./funcionesVarias/indiceDelMinimoHasta";
import { getCinematicParameters } from "./getCinematicParameters";

import { highPassIntegration } from "./metodos_integración/highPassIntegration";
import { optimizeWithTakeoffVelocity } from "./metodos_integración/optimizeWithTakeoffVelocity";

// const arrayY13 = [
//   -0.356437562216279, -0.9334907074805817, -1.4149623291998186,
//   -1.920497252595557, -2.72302473869464, -3.6008980610488965,
//   -4.726034946799184, -6.188028707527955, -7.791103658111535,
//   -8.339204337979783, -7.003639516145994, -6.017189363999093, -5.63475504622402,
//   -5.925168107669556, -6.556288538799599, -7.136643264959569,
//   -7.124532008946572, -6.282181847033366, -5.5225453034133265,
//   -5.04491999986093, -4.547589741350562, -3.6874195728680124,
//   -2.537621577585769, -1.0052518720058436, 0.7121828232826516,
//   2.5135725510179943, 4.318581986583284, 6.034082521357603, 7.441826087505014,
//   8.477334886182202, 9.0224978474104, 9.254543067620903, 9.220079187743217,
//   9.168507228026254, 9.181777996474143, 9.408352300475341, 9.743329819126693,
//   10.15490324410391, 10.577512326664971, 10.933458372057348, 11.35727021046079,
//   11.825402793016162, 12.645627532825586, 12.696849735391021,
//   12.746887935428036, 12.583270782775658, 12.293407495893687,
//   11.831050025799911, 11.21038565311956, 10.609537710997106, 9.90857641113537,
//   9.089657215777041, 8.453029327981332, 7.984983869003026, 7.822529231614986,
//   8.057512246478204, 8.310138209085409, 8.502356762486375, 8.366702321141277,
//   7.8488350085075, 6.437081709038062, 4.999779378502037, 3.8344518818360136,
//   3.013454984303372, 2.3193742626424707, 0.9473682551997472,
//   -1.6771706644177864,
// ];
// const arrayY13T = [
//   1.066, 1.077, 1.091, 1.103, 1.116, 1.128, 1.14, 1.153, 1.164, 1.175, 1.186,
//   1.199, 1.212, 1.224, 1.237, 1.248, 1.262, 1.273, 1.286, 1.297, 1.309, 1.321,
//   1.332, 1.344, 1.356, 1.367, 1.38, 1.391, 1.411, 1.42, 1.429, 1.44, 1.45,
//   1.461, 1.474, 1.487, 1.498, 1.51, 1.521, 1.532, 1.545, 1.565, 1.578, 1.589,
//   1.6, 1.612, 1.625, 1.637, 1.647, 1.66, 1.671, 1.683, 1.695, 1.706, 1.718,
//   1.732, 1.742, 1.757, 1.778, 1.787, 1.796, 1.806, 1.817, 1.83, 1.841, 1.852,
//   1.865,
// ];
export const kinematicAnalysis = (
  arrayY13 = [],
  arrayY13T = [],
  mass = 0,
  velD = 0
) => {
  // --- Paso 1: Validación inicial ---
  if (arrayY13.length !== arrayY13T.length) {
    throw new Error(
      "Los arrays de aceleración y tiempo deben tener la misma longitud."
    );
  }
  // velocidad y posicion ponderada con la velocidad de despegue calculada por la altura de vuelo
  const result = optimizeWithTakeoffVelocity(arrayY13, arrayY13T, velD);
  // velocidad filtrada sin ponderacion
  const highpassResponse = highPassIntegration(arrayY13, arrayY13T);
  const takeOffVelocityCalculated = Number(
    highpassResponse.velocity[highpassResponse.velocity.length - 1].toFixed(3)
  );
  const displacement = result.position;
  const finalDisplacement =
    highpassResponse.position[highpassResponse.position.length - 1];

  // seteamos velocidad a la ponderada para hacer los cálculos
  const velocity = result.velocity;

  // velocidad excéntrica máxima. es la velocidad mínima, uq es cuando la la aceleracion pasa a ser positiva, coincide con el index2
  const eccPeakVelocity = Number(Math.min(...velocity).toFixed(3));

  // Calcular fuerza instantánea neta (asumiendo arrayY13 ya corrige gravedad) ---
  const instantForce = arrayY13.map((a) => mass * (a + 9.81)); // F = m·a

  // --- Paso 4: Identificar la fase propulsiva (velocidad > 0) ---

  const propulsiveIndices = [];
  for (let i = 0; i < velocity.length; i++) {
    if (velocity[i] > 0) propulsiveIndices.push(i);
  }

  // INDICES DE RELEVANCIA

  // 1. buscamos el ultimo indice de la fase excéntrica
  const lastIndexEccPhase = propulsiveIndices[0] - 1;

  // 2. indice de comienzo de la fase de frenado (braking), es cuando la aceleracion es mínima antes del lastIndexEccPhase
  const brakingStartIndex = indiceDelMinimoHasta(arrayY13, lastIndexEccPhase);

  // 3. indice de comienzo de la desaceleracion: esto es cuando la aceleración pasa de ser negativa a positiva o cuando la velocidad es máxima (negativa)
  const decelerationPhaseOnsetIndex = velocity.findIndex(
    (el) => el === eccPeakVelocity
  );

  // Obtenemos parte propulsiva de la aceleración
  const propulsiveAcceleration = [];
  const propulsiveAccTime = [];
  for (let i = 0; i < arrayY13.length; i++) {
    if (velocity[i] > 0) {
      propulsiveAcceleration.push(arrayY13[i]);
      propulsiveAccTime.push(arrayY13T[i]);
    }
  }

  // tiempo propulsivo
  const tiempoPropulsivo = Number(
    (
      propulsiveAccTime[propulsiveAccTime.length - 1] - propulsiveAccTime[0]
    ).toFixed(3)
  );

  // Obtenemos parte propulsiva de la velocidad
  const propulsiveVelocity = [];
  for (let i = 0; i < arrayY13.length; i++) {
    if (velocity[i] > 0) {
      propulsiveVelocity.push(velocity[i]);
    }
  }

  // Obtenemos parte propulsiva de la posicion
  const propulsiveDisplacement = [];
  for (let i = 0; i < arrayY13.length; i++) {
    if (velocity[i] > 0) {
      propulsiveDisplacement.push(displacement[i]);
    }
  }
  const distanciaPropulsiva = Number(
    (
      propulsiveDisplacement[propulsiveDisplacement.length - 1] -
      propulsiveDisplacement[0]
    ).toFixed(3)
  );

  // obtener la parte propulsiva de la fuerza y el pico de fuerza excentrico con el indice de final de fase excéntrica que ya encontramos
  const propulsiveForce = [];
  let eccPeakForce = 0;
  let initBreakForce = 0;
  for (let i = 0; i < arrayY13.length; i++) {
    if (i === brakingStartIndex) {
      initBreakForce = parseInt(instantForce[i]);
    }
    if (i === lastIndexEccPhase) {
      eccPeakForce = parseInt(instantForce[i]);
    }
    if (velocity[i] > 0) {
      propulsiveForce.push(instantForce[i]);
    }
  }
  // console.log(instantForce);

  // pico de fuerza excentrica  por kilo
  const deltaBrakingForce = eccPeakForce - initBreakForce;
  // console.log(deltaBrakingForce);

  const eccPeakForceBM = parseInt(eccPeakForce / mass);
  // DINÁMICA DE FASE EXCÉNTRICA
  // ---- Eccentric Rate of Force Development La Tasa de Desaceleración - Excéntrica del Desarrollo de Fuerza que la tomamos desde el indice de inicio de frenado hasta el de fin de fase excentrica , la fuerza ya la tenemos el eccPeakForce y debemos dividirlo por el intervalo de tiempo

  let initialIndex = 0;
  let finalIndex = 0;
  arrayY13T.map((el, index) => {
    initialIndex = arrayY13T[brakingStartIndex];
    finalIndex = arrayY13T[lastIndexEccPhase];
  });

  const decelerationTimeDelta = Number((finalIndex - initialIndex).toFixed(3));

  const eccRFD = parseInt(eccPeakForce / decelerationTimeDelta);
  // lo hacemos relativo al peso
  const eccRFDBM = parseInt(eccRFD / mass);

  //  fuerza maxima en concentrica
  const conPeakForce = parseInt(Math.max(...instantForce));
  const conPeakForceBM = parseInt(conPeakForce / mass);

  // --------------------------------

  // Calculamos la fuerza media durante la fase propulsiva

  const meanPropulsiveForce = parseInt(
    propulsiveForce.reduce((sum, f) => sum + f, 0) / propulsiveForce.length
  );

  // obtenemos el array completo de potencia instantanea
  const instantPower = velocity.map((v, i) => parseInt(instantForce[i] * v));
  // POTENCIA
  // potencia concéntrica maxima
  const conPeakPower = Math.max(...instantPower);

  const conPeakPowerBM = parseInt(conPeakPower / mass);
  // obtener la parte propulsiva de la potencia y el pico de potencia excentrica
  const propulsivePower = [];

  for (let i = 0; i < arrayY13.length; i++) {
    if (velocity[i] > 0) {
      propulsivePower.push(instantPower[i]);
    }
  }
  // pico de potencia excentrica
  const eccPeakPower = Math.min(...instantPower);
  const eccPeakPowerBM = parseInt(eccPeakPower / mass);
  // Calculamos la potencia media durante la fase propulsiva
  const meanPropulsivePower = parseInt(
    propulsivePower.reduce((sum, p) => sum + p, 0) / propulsivePower.length
  );

  return {
    arrayY13T,
    arrayY13,
    displacement,
    instantForce,
    instantPower,
    velocity: highpassResponse.velocity,
    velocidadPonderada: result.velocity,
    distanciaPropulsiva,
    tiempoPropulsivo,
    takeOffVelocityCalculated,
    meanPropulsiveForce,
    meanPropulsivePower,
    eccPeakVelocity,
    eccPeakForce,
    eccPeakForceBM,

    // recibir en el componente
    eccRFD,
    eccRFDBM,
    eccPeakPower,
    eccPeakPowerBM,

    conPeakForce,
    conPeakForceBM,
    conPeakPower,
    conPeakPowerBM,

    // Datos para renderizado y análisis
    propulsiveAcceleration,
    propulsiveAccTime,
  };
};
