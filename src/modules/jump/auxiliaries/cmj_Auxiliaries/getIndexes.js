const calculateMode = (arr) => {
  const frequency = {};
  let maxFreq = 0;
  let mode = arr[0];

  for (const num of arr) {
    const rounded = Number(num.toFixed(2)); // Redondeamos a 2 decimales para agrupar mejor
    frequency[rounded] = (frequency[rounded] || 0) + 1;

    if (frequency[rounded] > maxFreq) {
      maxFreq = frequency[rounded];
      mode = rounded;
    }
  }

  return mode;
};

const getIndexes = (accY, modo, accT) => {
  const arrayY0 = accY.map((el) => (el - modo) * 9.81);

  // index 2 donde la aceleracion pasa a ser positiva luego del impulso
  const index2 = arrayY0.findIndex(
    (el, index) =>
      el > modo &&
      el < arrayY0[index + 1] &&
      el < arrayY0[index + 2] &&
      el < arrayY0[index + 3] &&
      el < arrayY0[index + 4] &&
      el < arrayY0[index + 5] &&
      el < arrayY0[index + 6] &&
      el < arrayY0[index + 7] &&
      el < arrayY0[index + 8] &&
      el < arrayY0[index + 9] &&
      el < arrayY0[index + 10] &&
      el < arrayY0[index + 11] &&
      el < arrayY0[index + 12] &&
      el < arrayY0[index + 13] &&
      el < arrayY0[index + 14] &&
      el < arrayY0[index + 15] &&
      el < arrayY0[index + 16]
  );

  const arrayY1 = [];

  arrayY0.map((el, index) => {
    if (index < index2) {
      arrayY1.push(el);
    }
  });

  const modo2 = calculateMode(arrayY1); // Reemplazo aquí
  // index 1 es donde empieza el descenso para tomar impulso
  const index1 = arrayY1.findIndex((el, index) => el < modo2 - 0.3);

  const arrayY2 = [];

  arrayY1.map((el, index) => {
    if (index > index1) {
      arrayY2.push(el);
    }
  });
  // index 3 es el momento donde despega y comienza la fase aerea
  const index3 = arrayY0.findIndex((el, index) => el < 0 && index > index2);

  const arrayY3 = [];
  const arrayY3T = [];

  arrayY0.map((el, index) => {
    if (index >= index2 && index < index3) {
      arrayY3.push(el);
      arrayY3T.push(accT[index]);
    }
  });

  // array y4 es el de la fase aerea, para buscar el indice 4 que seria cuando termina el array 4 buscamos valores negativos de aceleración pero solo luego de los 20 primeros valores para que no tome ningun pico de inercia positivo
  const index4 = arrayY0.findIndex(
    (el, index) => el > 0 && index > index3 + 20
  );

  const arrayY4 = [];
  const arrayXAxis = [];
  const arrayY4T = [];
  arrayY0.map((el, index) => {
    if (index - 3 > index3 && index + 3 < index4) {
      arrayY4.push(el);
      arrayY4T.push(accT[index]);
      arrayXAxis.push(0);
    }
  });

  const index5 = arrayY0.findIndex((el, index) => el < 0 && index > index4);
  const index6 = arrayY0.findIndex((el, index) => el > 0 && index > index5);
  const arrayY0F = [];
  const arrayY0Vuelo = [];
  const cMJXAxis = [];

  arrayY0.forEach((el, index) => {
    if (index > index1 && index < index6) {
      arrayY0F.push(Number(el.toFixed(3)));
      cMJXAxis.push(0);
    }
    if (index > index3 && index < index4) {
      arrayY0Vuelo.push(Number(el.toFixed(2)));
    }
  });

  const initalTail = [];
  arrayY0.map((el, index) => {
    if (index < index1) initalTail.push(el);
  });

  const finalTail = [];
  arrayY0.map((el, index) => {
    if (index > arrayY0.length - 90) finalTail.push(el);
  });

  const arrayY0FLong = arrayY0F;
  const cMJXAxisLong = cMJXAxis;

  // array Y13 es el array de la suma del descenso y el impulso,o sea todo el movimeinto antes del despegue y arrayY13T es el array de tiempo de ese periodo
  const arrayY13 = [];
  const arrayY13T = [];

  arrayY0.map((el, index) => {
    if (index >= index1 && index <= index3) {
      arrayY13.push(el);
      arrayY13T.push(accT[index]);
    }
  });

  const groundContactTime = arrayY13T[arrayY13T.length - 1] - arrayY13T[0];

  return {
    index1,
    index2,
    index3,
    index4,
    arrayY4T,
    index5,
    index6,
    arrayY0,
    arrayY3,
    arrayY4,
    arrayY3T,
    arrayXAxis,
    accT,
    arrayY0F,
    arrayY0FLong,
    cMJXAxis,
    cMJXAxisLong,
    arrayY13,
    arrayY13T,
    groundContactTime,
  };
};

export default getIndexes;
