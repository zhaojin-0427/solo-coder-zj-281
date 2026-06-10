import { query, queryOne } from '../db/index.js';

function getSkinSensitivityLevel() {
  const profile = queryOne(`
    SELECT 
      AVG(sensitivity) as avg_sensitivity,
      COUNT(*) as record_count
    FROM usage_records
    WHERE sensitivity IS NOT NULL
  `);
  
  if (!profile || profile.record_count === 0) return 1;
  
  const avgSensitivity = profile.avg_sensitivity || 1;
  if (avgSensitivity >= 4) return 3;
  if (avgSensitivity >= 2.5) return 2;
  return 1;
}

function getHistoricalUsageData(sourceType, sourceId) {
  if (sourceType === 'formula') {
    return query(`
      SELECT 
        ur.date,
        ur.sensitivity,
        ur.improvement,
        ur.reactions,
        ur.skin_condition
      FROM usage_records ur
      WHERE ur.formula_id = ?
      ORDER BY ur.date DESC
      LIMIT 20
    `, [sourceId]);
  } else if (sourceType === 'ingredient') {
    return query(`
      SELECT 
        ur.date,
        ur.sensitivity,
        ur.improvement,
        ur.reactions,
        ir.severity
      FROM usage_records ur
      JOIN ingredient_reactions ir ON ur.id = ir.record_id
      WHERE ir.ingredient_id = ?
      ORDER BY ur.date DESC
      LIMIT 20
    `, [sourceId]);
  }
  return [];
}

function getFormulaRiskWarnings(formulaId) {
  const formula = queryOne(`
    SELECT 
      f.*,
      GROUP_CONCAT(i.name) as ingredient_names,
      MAX(i.safety_level) as max_safety_level
    FROM formulas f
    JOIN formula_ingredients fi ON f.id = fi.formula_id
    JOIN ingredients i ON fi.ingredient_id = i.id
    WHERE f.id = ?
    GROUP BY f.id
  `, [formulaId]);
  
  if (!formula) return [];
  
  const warnings = [];
  const maxSafetyLevel = formula.max_safety_level || 1;
  const parseJSON = (value) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return value;
  };
  
  if (maxSafetyLevel >= 4) {
    warnings.push({
      level: 'danger',
      type: 'high_risk_ingredient',
      message: '配方中含有高风险成分，建议从极低剂量开始建立耐受'
    });
  } else if (maxSafetyLevel >= 3) {
    warnings.push({
      level: 'warning',
      type: 'medium_risk_ingredient',
      message: '配方中含有中等风险成分，需密切观察皮肤反应'
    });
  }
  
  const contraindications = parseJSON(formula.contraindications);
  if (contraindications.length > 0) {
    warnings.push({
      level: 'warning',
      type: 'contraindication',
      message: `配方有 ${contraindications.length} 项使用禁忌，使用前请确认`
    });
  }
  
  return warnings;
}

function getIngredientRiskWarnings(ingredientId) {
  const ingredient = queryOne(`
    SELECT * FROM ingredients WHERE id = ?
  `, [ingredientId]);
  
  if (!ingredient) return [];
  
  const warnings = [];
  const safetyLevel = ingredient.safety_level || 1;
  const parseJSON = (value) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return value;
  };
  
  if (safetyLevel >= 4) {
    warnings.push({
      level: 'danger',
      type: 'high_risk_ingredient',
      message: '该成分风险等级较高，建议从极低剂量开始建立耐受'
    });
  } else if (safetyLevel >= 3) {
    warnings.push({
      level: 'warning',
      type: 'medium_risk_ingredient',
      message: '该成分有一定刺激性，需密切观察皮肤反应'
    });
  }
  
  const contraindications = parseJSON(ingredient.contraindications);
  if (contraindications.length > 0) {
    warnings.push({
      level: 'warning',
      type: 'contraindication',
      message: `该成分有 ${contraindications.length} 项使用禁忌`
    });
  }
  
  return warnings;
}

function getSourceInfo(sourceType, sourceId) {
  if (sourceType === 'formula') {
    return queryOne('SELECT id, name FROM formulas WHERE id = ?', [sourceId]);
  } else if (sourceType === 'ingredient') {
    return queryOne('SELECT id, name FROM ingredients WHERE id = ?', [sourceId]);
  }
  return null;
}

export {
  getSkinSensitivityLevel,
  getHistoricalUsageData,
  getFormulaRiskWarnings,
  getIngredientRiskWarnings,
  getSourceInfo
};
