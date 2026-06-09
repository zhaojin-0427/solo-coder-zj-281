import { query, queryOne } from '../db/index.js';

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

function getFormulaReview(formulaId) {
  const formula = queryOne('SELECT id, name FROM formulas WHERE id = ?', [formulaId]);
  if (!formula) return null;

  const records = query(`
    SELECT 
      ur.id,
      ur.absorption,
      ur.sensitivity,
      ur.improvement,
      ur.rating,
      ur.notes,
      ur.date,
      ur.reactions
    FROM usage_records ur
    WHERE ur.formula_id = ?
    ORDER BY ur.date DESC, ur.created_at DESC
  `, [formulaId]);

  if (records.length === 0) {
    return {
      formulaId: formula.id,
      formulaName: formula.name,
      useCount: 0,
      avgAbsorption: 0,
      avgSensitivity: 0,
      avgImprovement: 0,
      lastFeedback: null,
      lastFeedbackDate: null,
      lastRating: null,
      reactionKeywords: [],
      adaptationConclusion: '暂无使用记录，无法评估适配性',
      recommendation: 'continue',
      recommendationReason: '请先添加使用记录后再查看复盘分析',
      fitnessScore: 0,
      riskLevel: 'low',
      sensitiveIngredients: []
    };
  }

  const useCount = records.length;
  const avgAbsorption = records.reduce((sum, r) => sum + (r.absorption || 0), 0) / useCount;
  const avgSensitivity = records.reduce((sum, r) => sum + (r.sensitivity || 0), 0) / useCount;
  const avgImprovement = records.reduce((sum, r) => sum + (r.improvement || 0), 0) / useCount;
  const avgRating = records.reduce((sum, r) => sum + (r.rating || r.improvement || 0), 0) / useCount;

  const lastRecord = records[0];
  const lastFeedback = lastRecord.notes;
  const lastFeedbackDate = lastRecord.date;
  const lastRating = lastRecord.rating || lastRecord.improvement;

  const reactionKeywords = new Set();
  records.forEach(r => {
    try {
      const reactions = JSON.parse(r.reactions || '[]');
      reactions.forEach(react => {
        if (typeof react === 'string') {
          reactionKeywords.add(react);
        } else if (react.type) {
          reactionKeywords.add(react.type);
        }
      });
    } catch (e) {
      // ignore parse errors
    }
  });

  const ingredientSensitivities = query(`
    SELECT 
      i.id,
      i.name,
      COUNT(DISTINCT ir.record_id) as sensitivity_count,
      AVG(ir.sensitivity) as avg_sensitivity
    FROM formula_ingredients fi
    JOIN ingredients i ON fi.ingredient_id = i.id
    LEFT JOIN ingredient_reactions ir ON i.id = ir.ingredient_id
    JOIN usage_records ur ON ir.record_id = ur.id
    WHERE fi.formula_id = ? AND ur.formula_id = ?
    GROUP BY i.id, i.name
    HAVING sensitivity_count > 0
    ORDER BY avg_sensitivity DESC
  `, [formulaId, formulaId]);

  const sensitiveIngredients = ingredientSensitivities
    .filter(ing => ing.avg_sensitivity >= 3)
    .map(ing => ({
      id: ing.id,
      name: ing.name,
      sensitivityCount: ing.sensitivity_count,
      avgSensitivity: Math.round(ing.avg_sensitivity * 10) / 10
    }));

  const fitnessScore = Math.round(
    (avgAbsorption * 0.3 + (6 - avgSensitivity) * 0.3 + avgImprovement * 0.4) * 10
  ) / 10;

  let recommendation = 'continue';
  let recommendationReason = '';
  let riskLevel = 'low';
  let adaptationConclusion = '';

  const highSensitivityCount = records.filter(r => (r.sensitivity || 0) >= 4).length;
  const highSensitivityRatio = highSensitivityCount / useCount;

  if (avgSensitivity >= 4 || highSensitivityRatio >= 0.5) {
    recommendation = 'suspend';
    riskLevel = 'high';
    adaptationConclusion = '该配方对您的皮肤刺激性较高，多次出现敏感反应';
    recommendationReason = `平均敏感度达${avgSensitivity.toFixed(1)}分，超过50%的使用记录出现明显敏感反应，建议立即暂停使用`;
  } else if (avgSensitivity >= 3 || highSensitivityRatio >= 0.3) {
    if (sensitiveIngredients.length > 0) {
      recommendation = 'replace_ingredient';
      riskLevel = 'medium';
      adaptationConclusion = '配方中部分成分可能引起皮肤敏感';
      recommendationReason = `建议更换${sensitiveIngredients.map(i => i.name).join('、')}等易引起敏感的成分`;
    } else {
      recommendation = 'reduce_drops';
      riskLevel = 'medium';
      adaptationConclusion = '配方浓度可能偏高，建议调整';
      recommendationReason = '平均敏感度偏高，建议适当降低精油滴数，减少皮肤负担';
    }
  } else if (avgImprovement < 3) {
    recommendation = 'replace_ingredient';
    riskLevel = 'medium';
    adaptationConclusion = '配方改善效果未达预期';
    recommendationReason = '平均改善效果评分较低，建议调整成分组合以提升功效';
  } else if (avgAbsorption < 3) {
    recommendation = 'reduce_drops';
    riskLevel = 'low';
    adaptationConclusion = '配方吸收度一般，可适当调整';
    recommendationReason = '吸收度评分偏低，建议适当减少基础油比例或调整渗透较好的基础油';
  } else if (avgImprovement >= 4.5 && avgSensitivity <= 1.5) {
    recommendation = 'continue';
    riskLevel = 'low';
    adaptationConclusion = '该配方非常适合您的皮肤';
    recommendationReason = '各项评分优秀，建议继续使用，定期观察皮肤反应';
  } else {
    recommendation = 'continue';
    riskLevel = 'low';
    adaptationConclusion = '该配方整体适合您的皮肤';
    recommendationReason = '各项指标正常，建议维持现有配方，继续观察效果';
  }

  return {
    formulaId: formula.id,
    formulaName: formula.name,
    useCount,
    avgAbsorption: Math.round(avgAbsorption * 10) / 10,
    avgSensitivity: Math.round(avgSensitivity * 10) / 10,
    avgImprovement: Math.round(avgImprovement * 10) / 10,
    lastFeedback,
    lastFeedbackDate,
    lastRating,
    reactionKeywords: Array.from(reactionKeywords).slice(0, 10),
    adaptationConclusion,
    recommendation,
    recommendationReason,
    fitnessScore,
    riskLevel,
    sensitiveIngredients
  };
}

function checkFormulaRisks(baseOils = [], essentialOils = []) {
  const warnings = [];
  const allIngredients = [...baseOils, ...essentialOils];

  if (allIngredients.length === 0) {
    return warnings;
  }

  const ingredientIds = allIngredients.map(item => item.ingredientId);
  const ingredients = query(
    'SELECT id, name, contraindications, safety_level FROM ingredients WHERE id IN (' + 
    ingredientIds.map(() => '?').join(', ') + ')',
    ingredientIds
  );

  const ingredientMap = new Map();
  ingredients.forEach(ing => {
    ingredientMap.set(ing.id, {
      ...ing,
      contraindications: JSON.parse(ing.contraindications || '[]')
    });
  });

  const contraindicationSet = new Set();
  const contraIngredients = [];

  allIngredients.forEach(({ ingredientId }) => {
    const data = ingredientMap.get(ingredientId);
    if (!data) return;

    data.contraindications.forEach(contra => {
      if (contraindicationSet.has(contra)) {
        if (!warnings.find(w => w.message.includes(contra))) {
          warnings.push({
            level: 'warning',
            type: 'contraindication',
            message: `存在重复禁忌：${contra}`,
            details: '多个成分包含相同禁忌，可能增加风险',
            relatedIngredients: ingredients
              .filter(i => {
                const ci = JSON.parse(i.contraindications || '[]');
                return ci.includes(contra);
              })
              .map(i => ({ id: i.id, name: i.name }))
          });
        }
      } else {
        contraindicationSet.add(contra);
        contraIngredients.push({ id: data.id, name: data.name });
      }
    });

    if (data.safety_level >= 4) {
      warnings.push({
        level: data.safety_level === 5 ? 'danger' : 'warning',
        type: 'contraindication',
        message: `${data.name} 安全等级${data.safety_level === 5 ? '极高风险' : '较低'}`,
        details: '该成分安全等级为 ' + data.safety_level + '（1最安全，5最危险），使用时需特别注意',
        relatedIngredients: [{ id: data.id, name: data.name }]
      });
    }
  });

  const totalEssentialDrops = essentialOils.reduce((sum, i) => sum + i.drops, 0);
  const totalBaseDrops = baseOils.reduce((sum, i) => sum + i.drops, 0);
  const totalDrops = totalEssentialDrops + totalBaseDrops;

  if (totalDrops > 0) {
    const essentialRatio = totalEssentialDrops / totalDrops;
    if (essentialRatio > 0.3) {
      warnings.push({
        level: 'danger',
        type: 'drops_ratio',
        message: '精油比例过高',
        details: `单方精油占比达${(essentialRatio * 100).toFixed(0)}%，建议控制在30%以内`,
        relatedIngredients: essentialOils.map(o => {
          const ing = ingredientMap.get(o.ingredientId);
          return { id: o.ingredientId, name: ing?.name || '未知成分' };
        })
      });
    }

    if (totalEssentialDrops > 15) {
      warnings.push({
        level: 'danger',
        type: 'drops_ratio',
        message: '单方精油总滴数过多',
        details: `单方精油总滴数达${totalEssentialDrops}滴，建议单次配方控制在15滴以内`,
        relatedIngredients: essentialOils.map(o => {
          const ing = ingredientMap.get(o.ingredientId);
          return { id: o.ingredientId, name: ing?.name || '未知成分' };
        })
      });
    }
  }

  const sensitiveHistory = query(`
    SELECT 
      i.id,
      i.name,
      COUNT(DISTINCT ir.record_id) as reaction_count,
      AVG(ir.sensitivity) as avg_sensitivity
    FROM ingredients i
    JOIN ingredient_reactions ir ON i.id = ir.ingredient_id
    WHERE i.id IN (${ingredientIds.map(() => '?').join(', ')})
    GROUP BY i.id, i.name
    HAVING avg_sensitivity >= 3
    ORDER BY avg_sensitivity DESC
  `, ingredientIds);

  sensitiveHistory.forEach(ing => {
    warnings.push({
      level: 'warning',
      type: 'sensitivity_history',
      message: `${ing.name} 有历史敏感记录`,
      details: `该成分在过往使用中平均敏感度达${ing.avg_sensitivity.toFixed(1)}，共${ing.reaction_count}次敏感记录`,
      relatedIngredients: [{ id: ing.id, name: ing.name }]
    });
  });

  return warnings;
}

function getFormulaReviewRank() {
  const formulas = query(`
    SELECT DISTINCT f.id, f.name
    FROM formulas f
    JOIN usage_records ur ON f.id = ur.formula_id
  `);

  const reviews = formulas.map(f => getFormulaReview(f.id)).filter(Boolean);

  const sortedByFitness = [...reviews]
    .filter(r => r.riskLevel === 'low' && r.recommendation === 'continue')
    .sort((a, b) => b.fitnessScore - a.fitnessScore);
  const best = sortedByFitness.slice(0, 5).map(r => ({
    id: r.formulaId,
    name: r.formulaName,
    useCount: r.useCount,
    avgAbsorption: r.avgAbsorption,
    avgSensitivity: r.avgSensitivity,
    avgImprovement: r.avgImprovement,
    fitnessScore: r.fitnessScore,
    riskLevel: r.riskLevel,
    recommendation: r.recommendation,
    lastUsedDate: r.lastFeedbackDate
  }));

  const sortedByRisk = [...reviews]
    .filter(r => r.riskLevel !== 'low' || r.recommendation !== 'continue')
    .sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      const riskCompare = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (riskCompare !== 0) return riskCompare;
      const recommendOrder = { suspend: 0, replace_ingredient: 1, reduce_drops: 2, continue: 3 };
      return recommendOrder[a.recommendation] - recommendOrder[b.recommendation];
    });
  const risky = sortedByRisk.slice(0, 5).map(r => ({
    id: r.formulaId,
    name: r.formulaName,
    useCount: r.useCount,
    avgAbsorption: r.avgAbsorption,
    avgSensitivity: r.avgSensitivity,
    avgImprovement: r.avgImprovement,
    fitnessScore: r.fitnessScore,
    riskLevel: r.riskLevel,
    recommendation: r.recommendation,
    lastUsedDate: r.lastFeedbackDate
  }));

  return { best, risky };
}

export { analyzeFormula, getFormulaReview, checkFormulaRisks, getFormulaReviewRank };
export default { analyzeFormula, getFormulaReview, checkFormulaRisks, getFormulaReviewRank };
