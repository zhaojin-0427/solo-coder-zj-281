import { query } from '../db/index.js';

function analyzeFormula(baseOils = [], essentialOils = []) {
  const allIngredients = [...baseOils, ...essentialOils];

  if (allIngredients.length === 0) {
    return {
      effectTags: [],
      contraindications: [],
      suitableSkinTypes: []
    };
  }

  const ingredientIds = allIngredients.map(item => item.ingredientId);
  const placeholders = ingredientIds.map(() => '?').join(', ');
  const ingredients = query(
    `SELECT id, effects, contraindications, skin_types FROM ingredients WHERE id IN (${placeholders})`,
    ingredientIds
  );

  const ingredientMap = new Map();
  ingredients.forEach(ing => {
    ingredientMap.set(ing.id, {
      effects: JSON.parse(ing.effects || '[]'),
      contraindications: JSON.parse(ing.contraindications || '[]'),
      skin_types: JSON.parse(ing.skin_types || '[]')
    });
  });

  const effectTagsSet = new Set();
  const contraindicationsSet = new Set();
  const skinTypesArrays = [];

  allIngredients.forEach(({ ingredientId, drops }) => {
    const data = ingredientMap.get(ingredientId);
    if (!data) return;

    data.effects.forEach(effect => effectTagsSet.add(effect));
    data.contraindications.forEach(contra => contraindicationsSet.add(contra));
    if (data.skin_types.length > 0) {
      skinTypesArrays.push(data.skin_types);
    }
  });

  let suitableSkinTypes = [];
  if (skinTypesArrays.length > 0) {
    suitableSkinTypes = skinTypesArrays.reduce((intersection, current) => {
      return intersection.filter(type => current.includes(type));
    });
  }

  return {
    effectTags: Array.from(effectTagsSet),
    contraindications: Array.from(contraindicationsSet),
    suitableSkinTypes
  };
}

export { analyzeFormula };
export default analyzeFormula;
