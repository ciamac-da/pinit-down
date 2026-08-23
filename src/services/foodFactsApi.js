const findNutrientValue = (nutrients = [], matcher) => {
  const match = nutrients.find((nutrientEntry) => {
    const nutrientName = (
      nutrientEntry?.nutrientName ||
      nutrientEntry?.name ||
      nutrientEntry?.nutrient?.name ||
      ''
    ).toLowerCase();

    return matcher(nutrientName, nutrientEntry);
  });

  if (!match) return null;
  const rawValue = match.value ?? match.amount ?? match.nutrient?.amount;
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
};

export const extractCoreNutrients = (food) => {
  const nutrients = food?.foodNutrients || [];
  const labelNutrients = food?.labelNutrients || {};

  const caloriesFromLabel = Number(labelNutrients?.calories?.value);
  const proteinFromLabel = Number(labelNutrients?.protein?.value);
  const carbsFromLabel = Number(labelNutrients?.carbohydrates?.value);
  const fatFromLabel = Number(labelNutrients?.fat?.value);
  const fiberFromLabel = Number(labelNutrients?.fiber?.value);

  const caloriesFromList = findNutrientValue(
    nutrients,
    (name, entry) =>
      name.includes('energy') &&
      (((entry.unitName || entry?.nutrient?.unitName || '').toUpperCase() ===
        'KCAL') ||
        name.includes('kcal')),
  );

  const proteinFromList = findNutrientValue(nutrients, (name) =>
    name.includes('protein'),
  );

  const carbsFromList = findNutrientValue(
    nutrients,
    (name) => name.includes('carbohydrate'),
  );

  const fatFromList = findNutrientValue(
    nutrients,
    (name) =>
      name === 'total lipid (fat)' ||
      name === 'total fat (nlea)' ||
      name.includes('total lipid'),
  );

  const fiberFromList = findNutrientValue(
    nutrients,
    (name) => name.includes('fiber'),
  );

  return {
    calories: Number.isFinite(caloriesFromLabel)
      ? caloriesFromLabel
      : caloriesFromList,
    protein: Number.isFinite(proteinFromLabel)
      ? proteinFromLabel
      : proteinFromList,
    carbs: Number.isFinite(carbsFromLabel) ? carbsFromLabel : carbsFromList,
    fat: Number.isFinite(fatFromLabel) ? fatFromLabel : fatFromList,
    fiber: Number.isFinite(fiberFromLabel) ? fiberFromLabel : fiberFromList,
  };
};
