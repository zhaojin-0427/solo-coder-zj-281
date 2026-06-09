import { query, queryOne } from '../db/index.js';

const DAILY_BURN_HOURS = 4;
const AROMA_FAMILY_CONFLICTS = {
  citrus: ['woody', 'oriental'],
  woody: ['citrus', 'gourmand'],
  floral: ['spicy', 'herbal'],
  herbal: ['floral', 'oriental'],
  spicy: ['floral', 'fresh'],
  fresh: ['spicy', 'gourmand'],
  gourmand: ['fresh', 'woody'],
  oriental: ['herbal', 'citrus']
};

function parseCandle(candle) {
  if (!candle) return null;
  return {
    ...candle,
    scent_notes: JSON.parse(candle.scent_notes || '[]')
  };
}

function getAllCandles() {
  const candles = query(
    'SELECT * FROM candles WHERE is_active = 1 ORDER BY id'
  );
  return candles.map(parseCandle);
}

function getCandleById(id) {
  const candle = queryOne('SELECT * FROM candles WHERE id = ?', [id]);
  return parseCandle(candle);
}

function getAllAvailableCandles() {
  const candles = query(
    'SELECT * FROM candles WHERE is_active = 1 AND stock_quantity > 0 ORDER BY stock_quantity DESC'
  );
  return candles.map(parseCandle);
}

function calculateMatchScore(candle, subscription) {
  let score = 0;
  const preferredAromas = JSON.parse(subscription.preferred_aromas || '[]');
  const excludedScents = JSON.parse(subscription.excluded_scents || '[]');

  for (const note of candle.scent_notes) {
    if (excludedScents.includes(note)) {
      return -100;
    }
    if (preferredAromas.includes(note)) {
      score += 25;
    }
    if (preferredAromas.includes(candle.aroma_family)) {
      score += 15;
    }
  }

  if (candle.price <= subscription.budget_limit / subscription.candles_per_delivery) {
    score += 20;
  }

  score += Math.min(candle.stock_quantity, 10);

  if (candle.safety_level <= 2) {
    score += 10;
  }

  return score;
}

function detectAromaConflicts(selectedCandles) {
  const conflicts = [];
  const families = selectedCandles.map(c => c.aroma_family);

  for (let i = 0; i < families.length; i++) {
    for (let j = i + 1; j < families.length; j++) {
      const familyA = families[i];
      const familyB = families[j];
      if (AROMA_FAMILY_CONFLICTS[familyA]?.includes(familyB)) {
        conflicts.push({
          type: 'aroma_conflict',
          candleA: selectedCandles[i].name,
          candleB: selectedCandles[j].name,
          message: `${selectedCandles[i].name}(${familyA}) 与 ${selectedCandles[j].name}(${familyB}) 香调可能存在冲突，建议分开使用或调整搭配`
        });
      }
    }
  }

  return conflicts;
}

function calculateBurnDays(candles, dailyHours = DAILY_BURN_HOURS) {
  const totalBurnHours = candles.reduce((sum, c) => sum + c.burn_time_hours, 0);
  return Math.ceil(totalBurnHours / dailyHours);
}

function calculateNextDeliveryDate(startDate, cycle, currentDelivery = 0) {
  const start = new Date(startDate);
  const daysToAdd = {
    weekly: 7,
    biweekly: 14,
    monthly: 30
  };
  const days = daysToAdd[cycle] * currentDelivery;
  start.setDate(start.getDate() + days);
  return start.toISOString().split('T')[0];
}

function checkSpecialDates(deliveryDate, specialDates) {
  const dates = JSON.parse(specialDates || '[]');
  if (!Array.isArray(dates) || dates.length === 0) return null;

  const delivery = new Date(deliveryDate);
  const weekBefore = new Date(delivery);
  weekBefore.setDate(weekBefore.getDate() - 7);

  for (const special of dates) {
    if (!special.date || !special.type) continue;
    const specialDate = new Date(special.date);
    if (specialDate >= weekBefore && specialDate <= delivery) {
      return special;
    }
  }
  return null;
}

function findReplacement(candle, allCandles, excludedScents, budgetPerCandle) {
  const sameFamily = allCandles.filter(c =>
    c.id !== candle.id &&
    c.aroma_family === candle.aroma_family &&
    c.stock_quantity > 0 &&
    c.price <= budgetPerCandle &&
    !c.scent_notes.some(note => excludedScents.includes(note))
  );

  if (sameFamily.length > 0) {
    return sameFamily.sort((a, b) => b.stock_quantity - a.stock_quantity)[0];
  }

  const compatible = allCandles.filter(c =>
    c.id !== candle.id &&
    c.stock_quantity > 0 &&
    c.price <= budgetPerCandle &&
    !c.scent_notes.some(note => excludedScents.includes(note)) &&
    !AROMA_FAMILY_CONFLICTS[c.aroma_family]?.includes(candle.aroma_family)
  );

  if (compatible.length > 0) {
    return compatible[0];
  }

  return allCandles.find(c =>
    c.id !== candle.id &&
    c.stock_quantity > 0 &&
    c.price <= budgetPerCandle
  ) || null;
}

function predictRestock(candle, daysAhead = 30) {
  const recentDeliveries = query(`
    SELECT SUM(dc.quantity) as total_delivered
    FROM delivery_contents dc
    JOIN subscription_deliveries sd ON dc.delivery_id = sd.id
    WHERE dc.candle_id = ? 
    AND sd.scheduled_date >= DATE('now', '-30 days')
    AND sd.status IN ('generated', 'shipped', 'delivered')
  `, [candle.id]);

  const avgDailyDemand = recentDeliveries[0]?.total_delivered ? 
    recentDeliveries[0].total_delivered / 30 : 0.5;

  const daysUntilEmpty = avgDailyDemand > 0 ? 
    Math.floor(candle.stock_quantity / avgDailyDemand) : 999;

  const needsRestock = daysUntilEmpty < daysAhead;

  return {
    currentStock: candle.stock_quantity,
    avgDailyDemand,
    daysUntilEmpty,
    needsRestock,
    recommendedOrderQuantity: Math.ceil(avgDailyDemand * 60) - candle.stock_quantity
  };
}

function generateDeliveryPlan(subscriptionId) {
  const subscription = queryOne(
    'SELECT * FROM subscription_plans WHERE id = ?',
    [subscriptionId]
  );

  if (!subscription) {
    throw new Error('订阅计划不存在');
  }

  if (subscription.status !== 'active') {
    throw new Error('订阅计划未激活');
  }

  const excludedScents = JSON.parse(subscription.excluded_scents || '[]');
  const budgetPerCandle = subscription.budget_limit / subscription.candles_per_delivery;

  let allCandles = getAvailableCandlesWithRatings();
  
  const scentedCandles = allCandles.map(candle => ({
    ...candle,
    matchScore: calculateMatchScore(candle, subscription)
  })).filter(c => c.matchScore > 0);

  const sortedCandles = scentedCandles.sort((a, b) => b.matchScore - a.matchScore);

  const selected = [];
  const replacements = [];
  let totalPrice = 0;

  for (const candle of sortedCandles) {
    if (selected.length >= subscription.candles_per_delivery) break;
    if (totalPrice + candle.price > subscription.budget_limit) continue;
    if (candle.stock_quantity < 1) {
      const replacement = findReplacement(candle, allCandles, excludedScents, budgetPerCandle);
      if (replacement && !selected.find(s => s.id === replacement.id)) {
        replacements.push({
          original: candle,
          replacement,
          reason: `库存不足（剩余${candle.stock_quantity}）`
        });
        selected.push({ ...replacement, isReplacement: true, originalCandleId: candle.id, matchScore: replacement.matchScore || 50 });
        totalPrice += replacement.price;
      }
      continue;
    }
    selected.push({ ...candle, isReplacement: false });
    totalPrice += candle.price;
  }

  while (selected.length < subscription.candles_per_delivery) {
    const remainingBudget = subscription.budget_limit - totalPrice;
    const available = allCandles.find(c =>
      !selected.find(s => s.id === c.id) &&
      c.stock_quantity > 0 &&
      c.price <= remainingBudget &&
      !c.scent_notes.some(note => excludedScents.includes(note))
    );
    if (!available) break;
    selected.push({ ...available, isReplacement: false, matchScore: 30 });
    totalPrice += available.price;
  }

  const conflicts = detectAromaConflicts(selected);
  const burnDays = calculateBurnDays(selected);

  const deliveryNumber = subscription.total_deliveries + 1;
  const scheduledDate = calculateNextDeliveryDate(
    subscription.start_date,
    subscription.delivery_cycle,
    subscription.total_deliveries
  );

  const specialDate = checkSpecialDates(scheduledDate, subscription.special_dates);
  let deliveryNotes = '';
  if (specialDate) {
    deliveryNotes = `配送临近${specialDate.type === 'birthday' ? '生日' : '节日'}（${specialDate.date}）：${specialDate.note || '请注意礼品包装'}`;
  }

  const restockPredictions = selected.map(c => ({
    candle: c.name,
    prediction: predictRestock(c)
  }));

  const outOfStockNotes = replacements.length > 0 ?
    replacements.map(r => `${r.original.name} 缺货，已替换为 ${r.replacement.name}`).join('；') :
    null;

  return {
    subscriptionId: subscription.id,
    planName: subscription.plan_name,
    deliveryNumber,
    scheduledDate,
    specialDate,
    candles: selected.map(c => ({
      id: c.id,
      name: c.name,
      englishName: c.english_name,
      description: c.description,
      scentNotes: c.scent_notes,
      aromaFamily: c.aroma_family,
      burnTimeHours: c.burn_time_hours,
      price: c.price,
      matchScore: c.matchScore,
      isReplacement: c.isReplacement,
      originalCandleId: c.originalCandleId
    })),
    totalPrice: Math.round(totalPrice * 100) / 100,
    candleCount: selected.length,
    estimatedBurnDays: burnDays,
    conflictWarnings: conflicts,
    outOfStockNotes,
    deliveryNotes,
    replacements: replacements.map(r => ({
      original: { id: r.original.id, name: r.original.name },
      replacement: { id: r.replacement.id, name: r.replacement.name },
      reason: r.reason
    })),
    restockPredictions,
    nextPredictedDelivery: calculateNextDeliveryDate(
      subscription.start_date,
      subscription.delivery_cycle,
      subscription.total_deliveries + 1
    )
  };
}

function getAvailableCandlesWithRatings() {
  const candles = query(`
    SELECT c.*,
           AVG(ur.rating) as avg_rating,
           COUNT(ur.id) as use_count
    FROM candles c
    LEFT JOIN delivery_contents dc ON c.id = dc.candle_id
    LEFT JOIN subscription_deliveries sd ON dc.delivery_id = sd.id
    LEFT JOIN usage_records ur ON ur.formula_id IN (
      SELECT id FROM formulas WHERE id IN (
        SELECT formula_id FROM formula_ingredients WHERE ingredient_id IN (
          SELECT id FROM ingredients WHERE aroma LIKE '%' || c.name || '%'
        )
      )
    )
    WHERE c.is_active = 1 AND c.stock_quantity > 0
    GROUP BY c.id
    ORDER BY c.stock_quantity DESC, avg_rating DESC NULLS LAST
  `);

  return candles.map(c => ({
    ...parseCandle(c),
    avgRating: c.avg_rating ? parseFloat(c.avg_rating) : null,
    useCount: c.use_count || 0
  }));
}

export {
  getAllCandles,
  getCandleById,
  getAvailableCandlesWithRatings,
  calculateMatchScore,
  detectAromaConflicts,
  calculateBurnDays,
  calculateNextDeliveryDate,
  checkSpecialDates,
  findReplacement,
  predictRestock,
  generateDeliveryPlan
};

export default {
  getAllCandles,
  getCandleById,
  getAvailableCandlesWithRatings,
  calculateMatchScore,
  detectAromaConflicts,
  calculateBurnDays,
  calculateNextDeliveryDate,
  checkSpecialDates,
  findReplacement,
  predictRestock,
  generateDeliveryPlan
};
