import express from 'express';
import { query, queryOne, insert, transaction } from '../db/index.js';

const router = express.Router();

function parseRecord(record) {
  if (!record) return null;
  return {
    ...record,
    reactions: JSON.parse(record.reactions || '[]'),
    formula: record.formula_id ? {
      id: record.formula_id,
      name: record.formula_name,
      description: record.formula_description
    } : null
  };
}

function getRecordWithFormula(recordId) {
  const record = queryOne(
    `SELECT ur.*, f.name as formula_name, f.description as formula_description
     FROM usage_records ur
     LEFT JOIN formulas f ON ur.formula_id = f.id
     WHERE ur.id = ?`,
    [recordId]
  );

  if (!record) return null;

  const { formula_id, formula_name, formula_description, ...rest } = record;
  return {
    ...rest,
    reactions: JSON.parse(record.reactions || '[]'),
    formula: formula_id ? {
      id: formula_id,
      name: formula_name,
      description: formula_description
    } : null
  };
}

router.get('/', (req, res) => {
  try {
    const records = query(
      `SELECT ur.*, f.name as formula_name, f.description as formula_description
       FROM usage_records ur
       LEFT JOIN formulas f ON ur.formula_id = f.id
       ORDER BY ur.date DESC, ur.created_at DESC`
    );

    const parsedRecords = records.map(record => {
      const { formula_id, formula_name, formula_description, ...rest } = record;
      return {
        ...rest,
        reactions: JSON.parse(record.reactions || '[]'),
        formula: formula_id ? {
          id: formula_id,
          name: formula_name,
          description: formula_description
        } : null
      };
    });

    res.json({ success: true, data: parsedRecords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const record = getRecordWithFormula(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: '使用记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { formulaId, date, skinConditionBefore, skinConditionAfter, reactions = [], notes, rating } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: '使用日期不能为空' });
    }

    const recordId = transaction(() => {
      const id = insert('usage_records', {
        formula_id: formulaId || null,
        date,
        skin_condition_before: skinConditionBefore || null,
        skin_condition_after: skinConditionAfter || null,
        reactions: JSON.stringify(reactions),
        notes: notes || null,
        rating: rating || null
      });

      if (formulaId && reactions.length > 0) {
        const ingredients = query(
          'SELECT ingredient_id FROM formula_ingredients WHERE formula_id = ?',
          [formulaId]
        );

        reactions.forEach(reaction => {
          const reactionType = typeof reaction === 'string' ? reaction : reaction.type;
          const severity = typeof reaction === 'object' ? reaction.severity : null;

          ingredients.forEach(ing => {
            insert('ingredient_reactions', {
              ingredient_id: ing.ingredient_id,
              reaction_type: reactionType,
              description: typeof reaction === 'object' ? reaction.description || null : null,
              severity: severity || 3
            });
          });
        });
      }

      return id;
    });

    const record = getRecordWithFormula(recordId);
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
