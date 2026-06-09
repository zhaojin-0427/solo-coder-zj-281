import express from 'express';
import { query, queryOne } from '../db/index.js';

const router = express.Router();

function parseIngredient(ingredient) {
  if (!ingredient) return null;
  return {
    ...ingredient,
    type: ingredient.type === 'base_oil' ? 'base' : 'essential',
    effects: JSON.parse(ingredient.effects || '[]'),
    contraindications: JSON.parse(ingredient.contraindications || '[]'),
    skin_types: JSON.parse(ingredient.skin_types || '[]'),
    pairing_suggestions: JSON.parse(ingredient.pairing_suggestions || '[]')
  };
}

router.get('/', (req, res) => {
  try {
    const { type } = req.query;

    let sql = `SELECT id, name, english_name, type, description, effects, contraindications, skin_types, aroma, color, viscosity, origin, pairing_suggestions, safety_level, created_at, updated_at FROM ingredients`;
    let params = [];

    if (type) {
      const dbType = type === 'base' ? 'base_oil' : type === 'essential' ? 'essential_oil' : null;
      if (dbType) {
        sql += ' WHERE type = ?';
        params.push(dbType);
      }
    }

    sql += ' ORDER BY type, name';

    const ingredients = query(sql, params).map(parseIngredient);
    res.json({ success: true, data: ingredients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const ingredient = queryOne(
      `SELECT id, name, english_name, type, description, effects, contraindications, skin_types, aroma, color, viscosity, origin, pairing_suggestions, safety_level, created_at, updated_at
       FROM ingredients WHERE id = ?`,
      [req.params.id]
    );

    if (!ingredient) {
      return res.status(404).json({ success: false, error: '成分不存在' });
    }

    res.json({ success: true, data: parseIngredient(ingredient) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
