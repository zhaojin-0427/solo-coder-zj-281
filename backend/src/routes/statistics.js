import express from 'express';
import { query } from '../db/index.js';
import { getFormulaReviewRank } from '../utils/analysisEngine.js';

const router = express.Router();

router.get('/repurchase', (req, res) => {
  try {
    const stats = query(`
      SELECT 
        f.id,
        f.name,
        f.description,
        COUNT(ur.id) as use_count,
        AVG(ur.rating) as avg_rating
      FROM formulas f
      LEFT JOIN usage_records ur ON f.id = ur.formula_id
      GROUP BY f.id
      HAVING use_count > 0
      ORDER BY use_count DESC, avg_rating DESC
    `);

    const repurchaseRates = stats.map(stat => ({
      id: stat.id,
      name: stat.name,
      description: stat.description,
      useCount: stat.use_count,
      avgRating: stat.avg_rating ? Math.round(stat.avg_rating * 10) / 10 : 0,
      repurchaseRate: stat.use_count >= 3 ? '高' : stat.use_count >= 2 ? '中' : '低'
    }));

    res.json({ success: true, data: repurchaseRates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/fitness', (req, res) => {
  try {
    const { type } = req.query;

    let typeCondition = '';
    let params = [];
    if (type) {
      const dbType = type === 'base' ? 'base_oil' : type === 'essential' ? 'essential_oil' : null;
      if (dbType) {
        typeCondition = 'AND i.type = ?';
        params.push(dbType);
      }
    }

    const stats = query(`
      SELECT 
        i.id,
        i.name,
        i.english_name,
        i.type,
        COUNT(DISTINCT ur.id) as use_count,
        AVG(ur.rating) as avg_rating
      FROM ingredients i
      JOIN formula_ingredients fi ON i.id = fi.ingredient_id
      JOIN formulas f ON fi.formula_id = f.id
      LEFT JOIN usage_records ur ON f.id = ur.formula_id
      WHERE 1=1 ${typeCondition}
      GROUP BY i.id
      ORDER BY use_count DESC, avg_rating DESC
    `, params);

    const fitnessRank = stats.map(stat => ({
      id: stat.id,
      name: stat.name,
      englishName: stat.english_name,
      type: stat.type === 'base_oil' ? 'base' : 'essential',
      useCount: stat.use_count || 0,
      avgRating: stat.avg_rating ? Math.round(stat.avg_rating * 10) / 10 : 0,
      fitnessScore: stat.use_count > 0
        ? Math.round((stat.use_count * 0.4 + (stat.avg_rating || 3) * 0.6) * 10) / 10
        : 0
    }));

    res.json({ success: true, data: fitnessRank });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/skin-curve', (req, res) => {
  try {
    const stats = query(`
      SELECT 
        date,
        COUNT(*) as record_count,
        AVG(rating) as avg_rating
      FROM usage_records
      WHERE rating IS NOT NULL
      GROUP BY date
      ORDER BY date ASC
    `);

    const curveData = stats.map(stat => ({
      date: stat.date,
      recordCount: stat.record_count,
      avgRating: Math.round(stat.avg_rating * 10) / 10
    }));

    res.json({
      success: true,
      data: {
        totalRecords: curveData.reduce((sum, d) => sum + d.recordCount, 0),
        avgOverallRating: curveData.length > 0
          ? Math.round((curveData.reduce((sum, d) => sum + d.avgRating * d.recordCount, 0) /
            curveData.reduce((sum, d) => sum + d.recordCount, 0)) * 10) / 10
          : 0,
        curveData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trend', (req, res) => {
  try {
    const today = new Date();
    const eightWeeksAgo = new Date(today.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
      weeks.push({
        weekNumber: 8 - i,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      });
    }

    const records = query(`
      SELECT ur.date, ur.formula_id, fi.ingredient_id, i.name, i.english_name, i.type
      FROM usage_records ur
      JOIN formula_ingredients fi ON ur.formula_id = fi.formula_id
      JOIN ingredients i ON fi.ingredient_id = i.id
      WHERE ur.date >= ? AND i.type = 'essential_oil'
      ORDER BY ur.date ASC
    `, [eightWeeksAgo.toISOString().split('T')[0]]);

    const weeklyData = weeks.map(week => {
      const weekRecords = records.filter(r => r.date >= week.startDate && r.date <= week.endDate);
      const oilCounts = {};

      weekRecords.forEach(r => {
        if (!oilCounts[r.ingredient_id]) {
          oilCounts[r.ingredient_id] = {
            id: r.ingredient_id,
            name: r.name,
            englishName: r.english_name,
            count: 0
          };
        }
        oilCounts[r.ingredient_id].count++;
      });

      const topOils = Object.values(oilCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        ...week,
        totalUses: weekRecords.length,
        topOils
      };
    });

    const totalOilCounts = {};
    records.forEach(r => {
      if (!totalOilCounts[r.ingredient_id]) {
        totalOilCounts[r.ingredient_id] = {
          id: r.ingredient_id,
          name: r.name,
          englishName: r.english_name,
          count: 0
        };
      }
      totalOilCounts[r.ingredient_id].count++;
    });

    const overallTopOils = Object.values(totalOilCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        period: '最近8周',
        startDate: weeks[0].startDate,
        endDate: weeks[7].endDate,
        totalRecords: records.length,
        weeklyData,
        overallTopOils
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/formula-review-rank', (req, res) => {
  try {
    const rankData = getFormulaReviewRank();
    res.json({ success: true, data: rankData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
