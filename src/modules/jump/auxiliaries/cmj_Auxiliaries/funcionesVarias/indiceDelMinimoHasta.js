export function indiceDelMinimoHasta(array, indiceLimite) {
  if (!Array.isArray(array) || array.length === 0 || indiceLimite <= 0) {
    return -1; // Retorna -1 para casos inválidos
  }

  const limite = Math.min(indiceLimite, array.length);
  let indiceMinimo = 0;
  let minimo = array[0];

  for (let i = 1; i < limite; i++) {
    if (array[i] < minimo) {
      minimo = array[i];
      indiceMinimo = i;
    }
  }

  return indiceMinimo;
}
