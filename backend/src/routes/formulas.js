import express from 'express';
import { query, queryOne, insert, update, remove, transaction } from '../db/index.js';
import { analyzeFormula, getFormulaReview, checkFormulaRisks } from '../utils/analysisEngine.js';

const router = express.Router();

function getFormulaWithIngredients(formulaId) {
  const formula = queryOne(
    `SELECT id, name, description, purpose, effect_tags, contraindications, suitable_skin_types, notes, created_at, updated_at
     FROM formulas WHERE id = ?`,
    [formulaId]
  );

  if (!formula) return null;

  const ingredients = query(
    `SELECT fi.id, fi.ingredient_id, fi.type, fi.drops, i.name, i.english_name
     FROM formula_ingredients fi
     JOIN ingredients i ON fi.ingredient_id = i.id
     WHERE fi.formula_id = ?
     ORDER BY fi.type, fi.id`,
    [formulaId]
  );

  return {
    ...formula,
    effect_tags: JSON.parse(formula.effect_tags || '[]'),
    contraindications: JSON.parse(formula.contraindications || '[]'),
    suitable_skin_types: JSON.parse(formula.suitable_skin_types || '[]'),
    ingredients: ingredients.map(ing => ({
      ...ing,
      type: ing.type === 'base_oil' ? 'base' : 'essential'
    }))
  };
}

router.get('/', (req, res) => {
  try {
    const formulas = query(
      `SELECT id, name, description, purpose, effect_tags, contraindications, suitable_skin_types, notes, created_at, updated_at
       FROM formulas ORDER BY created_at DESC`
    );

    const formulasWithIngredients = formulas.map(formula => {
      const ingredients = query(
        `SELECT fi.id, fi.ingredient_id, fi.type, fi.drops, i.name, i.english_name
         FROM formula_ingredients fi
         JOIN ingredients i ON fi.ingredient_id = i.id
         WHERE fi.formula_id = ?
         ORDER BY fi.type, fi.id`,
        [formula.id]
      );

      return {
        ...formula,
        effect_tags: JSON.parse(formula.effect_tags || '[]'),
        contraindications: JSON.parse(formula.contraindications || '[]'),
        suitable_skin_types: JSON.parse(formula.suitable_skin_types || '[]'),
        ingredients: ingredients.map(ing => ({
          ...ing,
          type: ing.type === 'base_oil' ? 'base' : 'essential'
        }))
      };
    });

    res.json({ success: true, data: formulasWithIngredients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analyze', (req, res) => {
  try {
    const { baseOils = [], essentialOils = [] } = req.body;

    const analysis = analyzeFormula(
      baseOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops })),
      essentialOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops }))
    );

    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/check-risks', (req, res) => {
  try {
    const { baseOils = [], essentialOils = [] } = req.body;

    const warnings = checkFormulaRisks(
      baseOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops })),
      essentialOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops }))
    );

    res.json({ success: true, data: warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/review', (req, res) => {
  try {
    const review = getFormulaReview(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: '配方不存在' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const formula = getFormulaWithIngredients(req.params.id);
    if (!formula) {
      return res.status(404).json({ success: false, error: '配方不存在' });
    }
    res.json({ success: true, data: formula });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, purpose, notes, baseOils = [], essentialOils = [] } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: '配方名称不能为空' });
    }

    const analysis = analyzeFormula(
      baseOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops })),
      essentialOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops }))
    );

    const formulaId = transaction(() => {
      const id = insert('formulas', {
        name,
        description: description || null,
        purpose: purpose || null,
        effect_tags: JSON.stringify(analysis.effectTags),
        contraindications: JSON.stringify(analysis.contraindications),
        suitable_skin_types: JSON.stringify(analysis.suitableSkinTypes),
        notes: notes || null
      });

      baseOils.forEach(oil => {
        insert('formula_ingredients', {
          formula_id: id,
          ingredient_id: oil.ingredientId,
          type: 'base_oil',
          drops: oil.drops
        });
      });

      essentialOils.forEach(oil => {
        insert('formula_ingredients', {
          formula_id: id,
          ingredient_id: oil.ingredientId,
          type: 'essential_oil',
          drops: oil.drops
        });
      });

      return id;
    });

    const formula = getFormulaWithIngredients(formulaId);
    res.json({ success: true, data: formula });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, description, purpose, notes, baseOils, essentialOils } = req.body;

    const existing = queryOne('SELECT id FROM formulas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '配方不存在' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    let analysis = null;
    if (baseOils !== undefined || essentialOils !== undefined) {
      const currentIngredients = query(
        'SELECT ingredient_id, type, drops FROM formula_ingredients WHERE formula_id = ?',
        [req.params.id]
      );

      const finalBaseOils = baseOils !== undefined
        ? baseOils
        : currentIngredients.filter(i => i.type === 'base_oil').map(i => ({ ingredientId: i.ingredient_id, drops: i.drops }));

      const finalEssentialOils = essentialOils !== undefined
        ? essentialOils
        : currentIngredients.filter(i => i.type === 'essential_oil').map(i => ({ ingredientId: i.ingredient_id, drops: i.drops }));

      analysis = analyzeFormula(
        finalBaseOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops })),
        finalEssentialOils.map(o => ({ ingredientId: o.ingredientId, drops: o.drops }))
      );

      updateData.effect_tags = JSON.stringify(analysis.effectTags);
      updateData.contraindications = JSON.stringify(analysis.contraindications);
      updateData.suitable_skin_types = JSON.stringify(analysis.suitableSkinTypes);
    }

    transaction(() => {
      if (Object.keys(updateData).length > 0) {
        update('formulas', updateData, 'id = ?', [req.params.id]);
      }

      if (baseOils !== undefined) {
        remove('formula_ingredients', 'formula_id = ? AND type = ?', [req.params.id, 'base_oil']);
        baseOils.forEach(oil => {
          insert('formula_ingredients', {
            formula_id: req.params.id,
            ingredient_id: oil.ingredientId,
            type: 'base_oil',
            drops: oil.drops
          });
        });
      }

      if (essentialOils !== undefined) {
        remove('formula_ingredients', 'formula_id = ? AND type = ?', [req.params.id, 'essential_oil']);
        essentialOils.forEach(oil => {
          insert('formula_ingredients', {
            formula_id: req.params.id,
            ingredient_id: oil.ingredientId,
            type: 'essential_oil',
            drops: oil.drops
          });
        });
      }
    });

    const formula = getFormulaWithIngredients(req.params.id);
    res.json({ success: true, data: formula });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM formulas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '配方不存在' });
    }

    remove('formulas', 'id = ?', [req.params.id]);
    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
