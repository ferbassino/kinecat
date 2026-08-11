export function removeDownwardValleysMulti(data, passes = [2, 2, 3, 2, 2, 3]) {
  let result = [...data];

  for (let window of passes) {
    const temp = [...result];

    for (let i = window; i < result.length - window; i++) {
      const prev = result[i - window];
      const next = result[i + window];
      const current = result[i];

      if (current < prev && current < next) {
        // Es un valle: menor que sus vecinos
        temp[i] = (prev + next) / 2;
      }
    }

    result = temp;
  }

  return result;
}
