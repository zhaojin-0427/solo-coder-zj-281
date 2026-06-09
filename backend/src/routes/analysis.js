import express from 'express';
import { query, queryOne } from '../db/index.js';

const router = express.Router();

function calculateMetrics(records) {
  if (records.length === 0) {
    return {
      avgAbsorption: 0,
      avgSensitivity: 0,
      avgImprovement: 0
    };
  }

  let totalAbsorption = 0;
  let totalSensitivity = 0;
  let totalImprovement = 0;
  let validCount = 0;

  records.forEach(record => {
    const reactions = JSON.parse(record.reactions || '[]');
    const rating = record.rating || 3;

    const absorption = calculateAbsorption(record);
    const sensitivity = calculateSensitivity(reactions);
    const improvement = calculateImprovement(rating, record);

    totalAbsorption += absorption;
    totalSensitivity += sensitivity;
    totalImprovement += improvement;
    validCount++;
  });

  return {
    avgAbsorption: validCount > 0 ? Math.round((totalAbsorption / validCount) * 10) / 10 : 0,
    avgSensitivity: validCount > 0 ? Math.round((totalSensitivity / validCount) * 10) / 10 : 0,
    avgImprovement: validCount > 0 ? Math.round((totalImprovement / validCount) * 10) / 10 : 0
  };
}

function calculateAbsorption(record) {
  const notes = (record.notes || '').toLowerCase();
  const after = (record.skin_condition_after || '').toLowerCase();

  let score = 3;

  if (notes.includes('吸收') || after.includes('吸收')) {
    if (notes.includes('好') || notes.includes('快') || after.includes('好') || after.includes('快')) {
      score = 5;
    } else if (notes.includes('慢') || notes.includes('差') || after.includes('慢') || after.includes('差')) {
      score = 1;
    }
  }

  if (notes.includes('油腻') || after.includes('油腻')) {
    score -= 1;
  }
  if (notes.includes('清爽') || after.includes('清爽')) {
    score += 1;
  }

  return Math.max(1, Math.min(5, score));
}

function calculateSensitivity(reactions) {
  if (reactions.length === 0) return 1;

  const sensitiveReactions = ['刺痛', '过敏', '红肿', '发痒', '刺激', '不适'];
  let score = 1;

  reactions.forEach(reaction => {
    const reactionStr = typeof reaction === 'string' ? reaction : (reaction.type || '');
    sensitiveReactions.forEach(sr => {
      if (reactionStr.includes(sr)) {
        score += 1.5;
      }
    });
  });

  return Math.max(1, Math.min(5, score));
}

function calculateImprovement(rating, record) {
  const before = (record.skin_condition_before || '').toLowerCase();
  const after = (record.skin_condition_after || '').toLowerCase();

  let score = rating || 3;

  const positiveWords = ['改善', '好转', '减少', '减轻', '提亮', '紧致', '滋润', '舒缓', '稳定'];
  const negativeWords = ['加重', '恶化', '增加', '严重', '更差'];

  positiveWords.forEach(word => {
    if (after.includes(word) && !before.includes(word)) {
      score += 0.5;
    }
  });

  negativeWords.forEach(word => {
    if (after.includes(word) && !before.includes(word)) {
      score -= 1;
    }
  });

  return Math.max(1, Math.min(5, score));
}

function inferSkinType(records) {
  if (records.length === 0) return { type: '未知', confidence: 0 };

  const typeScores = {
    '干性': 0,
    '油性': 0,
    '混合性': 0,
    '敏感性': 0,
    '熟龄性': 0,
    '痘痘肌': 0
  };

  records.forEach(record => {
    const before = (record.skin_condition_before || '').toLowerCase();
    const after = (record.skin_condition_after || '').toLowerCase();
    const notes = (record.notes || '').toLowerCase();
    const text = before + after + notes;

    if (text.includes('干燥') || text.includes('脱皮') || text.includes('紧绷')) typeScores['干性'] += 2;
    if (text.includes('出油') || text.includes('油腻') || text.includes('油光')) typeScores['油性'] += 2;
    if (text.includes('t区') || text.includes('t字') || (text.includes('出油') && text.includes('干燥'))) typeScores['混合性'] += 2;
    if (text.includes('敏感') || text.includes('泛红') || text.includes('刺痛') || text.includes('过敏')) typeScores['敏感性'] += 2;
    if (text.includes('细纹') || text.includes('松弛') || text.includes('老化') || text.includes('熟龄')) typeScores['熟龄性'] += 2;
    if (text.includes('痘痘') || text.includes('粉刺') || text.includes('痤疮') || text.includes('痘印')) typeScores['痘痘肌'] += 2;

    if (text.includes('滋润')) typeScores['干性'] += 1;
    if (text.includes('控油')) typeScores['油性'] += 1;
    if (text.includes('舒缓')) typeScores['敏感性'] += 1;
    if (text.includes('抗老') || text.includes('紧致')) typeScores['熟龄性'] += 1;
    if (text.includes('祛痘')) typeScores['痘痘肌'] += 1;
  });

  const sortedTypes = Object.entries(typeScores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedTypes.length === 0) return { type: '中性', confidence: 0.5 };

  const totalScore = sortedTypes.reduce((sum, [, score]) => sum + score, 0);
  const topType = sortedTypes[0];
  const confidence = totalScore > 0 ? Math.round((topType[1] / totalScore) * 100) / 100 : 0;

  return {
    type: topType[0],
    confidence,
    allTypes: sortedTypes.map(([type, score]) => ({ type, score, ratio: totalScore > 0 ? Math.round((score / totalScore) * 100) / 100 : 0 }))
  };
}

function inferConcerns(records) {
  if (records.length === 0) return [];

  const concernCounts = {};

  const concernMap = {
    '保湿': ['干燥', '脱皮', '紧绷', '滋润', '补水'],
    '控油': ['出油', '油腻', '油光', '控油'],
    '抗敏': ['敏感', '泛红', '刺痛', '过敏', '舒缓'],
    '抗老': ['细纹', '松弛', '老化', '熟龄', '紧致', '抗老'],
    '祛痘': ['痘痘', '粉刺', '痤疮', '痘印', '祛痘'],
    '美白': ['暗沉', '提亮', '美白', '淡斑', '肤色'],
    '修复': ['修复', '屏障', '受损', '愈合'],
    '舒缓': ['压力', '放松', '助眠', '焦虑', '情绪']
  };

  records.forEach(record => {
    const before = (record.skin_condition_before || '').toLowerCase();
    const after = (record.skin_condition_after || '').toLowerCase();
    const notes = (record.notes || '').toLowerCase();
    const purpose = (record.purpose || '').toLowerCase();
    const text = before + after + notes + purpose;

    Object.entries(concernMap).forEach(([concern, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          concernCounts[concern] = (concernCounts[concern] || 0) + 1;
        }
      });
    });
  });

  return Object.entries(concernCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([concern, count]) => ({ concern, count }));
}

function calculateIngredientFitness(records) {
  const ingredientStats = new Map();

  records.forEach(record => {
    const formulaId = record.formula_id;
    if (!formulaId) return;

    const rating = record.rating || 3;
    const improvement = calculateImprovement(rating, record);

    const ingredients = query(
      'SELECT ingredient_id, type FROM formula_ingredients WHERE formula_id = ?',
      [formulaId]
    );

    ingredients.forEach(ing => {
      if (!ingredientStats.has(ing.ingredient_id)) {
        ingredientStats.set(ing.ingredient_id, {
          useCount: 0,
          totalImprovement: 0,
          type: ing.type
        });
      }
      const stats = ingredientStats.get(ing.ingredient_id);
      stats.useCount += 1;
      stats.totalImprovement += improvement;
    });
  });

  const ingredientDetails = query(
    `SELECT id, name, english_name, type FROM ingredients WHERE id IN (${Array.from(ingredientStats.keys()).map(() => '?').join(', ')})`,
    Array.from(ingredientStats.keys())
  );

  const fitnessList = ingredientDetails.map(ing => {
    const stats = ingredientStats.get(ing.id);
    const avgImprovement = stats.useCount > 0 ? stats.totalImprovement / stats.useCount : 0;
    const fitnessScore = (stats.useCount * 0.4) + (avgImprovement * 0.6);

    return {
      id: ing.id,
      name: ing.name,
      englishName: ing.english_name,
      type: ing.type === 'base_oil' ? 'base' : 'essential',
      useCount: stats.useCount,
      avgImprovement: Math.round(avgImprovement * 10) / 10,
      fitnessScore: Math.round(fitnessScore * 10) / 10
    };
  });

  return fitnessList.sort((a, b) => b.fitnessScore - a.fitnessScore);
}

router.get('/profile', (req, res) => {
  try {
    const records = query('SELECT * FROM usage_records ORDER BY date DESC');
    const totalRecords = records.length;

    const metrics = calculateMetrics(records);
    const skinType = inferSkinType(records);
    const concerns = inferConcerns(records);
    const ingredientFitness = calculateIngredientFitness(records);

    res.json({
      success: true,
      data: {
        totalRecords,
        avgAbsorption: metrics.avgAbsorption,
        avgSensitivity: metrics.avgSensitivity,
        avgImprovement: metrics.avgImprovement,
        skinType,
        concerns,
        ingredientFitness
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trend', (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const records = query(
      'SELECT * FROM usage_records WHERE date >= ? ORDER BY date ASC',
      [startDate]
    );

    const dailyData = {};

    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyData[date] = {
        date,
        count: 0,
        avgRating: 0,
        avgImprovement: 0,
        records: []
      };
    }

    records.forEach(record => {
      const date = record.date;
      if (!dailyData[date]) return;

      const improvement = calculateImprovement(record.rating || 3, record);

      dailyData[date].count += 1;
      dailyData[date].avgRating += record.rating || 3;
      dailyData[date].avgImprovement += improvement;
      dailyData[date].records.push({
        id: record.id,
        formulaId: record.formula_id,
        rating: record.rating,
        improvement
      });
    });

    const trendData = Object.values(dailyData).map(day => ({
      ...day,
      avgRating: day.count > 0 ? Math.round((day.avgRating / day.count) * 10) / 10 : 0,
      avgImprovement: day.count > 0 ? Math.round((day.avgImprovement / day.count) * 10) / 10 : 0
    }));

    res.json({
      success: true,
      data: {
        period: '最近30天',
        startDate,
        endDate: today.toISOString().split('T')[0],
        totalRecords: records.length,
        dailyData: trendData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
