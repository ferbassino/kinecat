export function coeficienteVariacion(data, eje = "dynamicMag") {
  if (!data?.length) return 0;

  const valores = data.map((d) => {
    if (typeof d === "number") return d;

    if (eje === "dynamicMag") {
      return Number(d.dynamicMag ?? 0);
    }

    if (eje === "magnitud") {
      return Number(Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2).toFixed(6));
    }

    return Number(d[eje] ?? 0);
  });

  const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;

  if (Math.abs(media) < 1e-9) return 0;

  const desviacion = Math.sqrt(
    valores.reduce((sum, val) => sum + (val - media) ** 2, 0) / valores.length,
  );

  return (desviacion / media) * 100;
}
