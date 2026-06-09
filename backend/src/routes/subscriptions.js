import express from 'express';
import { query, queryOne, insert, update, remove, transaction } from '../db/index.js';
import {
  generateDeliveryPlan,
  calculateNextDeliveryDate,
  getAllCandles,
  getCandleById,
  predictRestock
} from '../utils/subscriptionEngine.js';

const router = express.Router();

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function addCamelCaseFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    if (camelKey !== key && !(camelKey in result)) {
      result[camelKey] = obj[key];
    }
  }
  return result;
}

function parseSubscription(sub) {
  if (!sub) return null;
  const parsed = {
    ...sub,
    preferred_aromas: JSON.parse(sub.preferred_aromas || '[]'),
    excluded_scents: JSON.parse(sub.excluded_scents || '[]'),
    special_dates: JSON.parse(sub.special_dates || '[]')
  };
  const withCamel = addCamelCaseFields(parsed);
  withCamel.preferredAromas = parsed.preferred_aromas;
  withCamel.excludedScents = parsed.excluded_scents;
  withCamel.specialDates = parsed.special_dates;
  return withCamel;
}

function parseDelivery(delivery) {
  if (!delivery) return null;
  const parsed = {
    ...delivery,
    conflict_warnings: JSON.parse(delivery.conflict_warnings || '[]')
  };
  const withCamel = addCamelCaseFields(parsed);
  withCamel.conflictWarnings = parsed.conflict_warnings;
  return withCamel;
}

function parseCandle(candle) {
  if (!candle) return null;
  const parsed = {
    ...candle,
    scent_notes: JSON.parse(candle.scent_notes || '[]')
  };
  const withCamel = addCamelCaseFields(parsed);
  withCamel.scentNotes = parsed.scent_notes;
  return withCamel;
}

router.get('/candles', (req, res) => {
  try {
    const candles = getAllCandles();
    res.json({ success: true, data: candles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/candles/:id', (req, res) => {
  try {
    const candle = getCandleById(req.params.id);
    if (!candle) {
      return res.status(404).json({ success: false, error: '蜡烛不存在' });
    }
    const restockInfo = predictRestock(candle);
    res.json({ success: true, data: { ...candle, restockInfo } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM subscription_plans';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';

    const subscriptions = query(sql, params);
    const parsed = subscriptions.map(parseSubscription);

    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    const deliveries = query(
      `SELECT sd.*, 
              GROUP_CONCAT(c.name || '(' || dc.quantity || ')') as candle_list
       FROM subscription_deliveries sd
       LEFT JOIN delivery_contents dc ON sd.id = dc.delivery_id
       LEFT JOIN candles c ON dc.candle_id = c.id
       WHERE sd.subscription_id = ?
       GROUP BY sd.id
       ORDER BY sd.delivery_number DESC`,
      [req.params.id]
    );

    const parsedSub = parseSubscription(subscription);
    const parsedDeliveries = deliveries.map(d => {
      const candleList = d.candle_list ? d.candle_list.split(',') : [];
      return {
        ...parseDelivery(d),
        candle_list: candleList,
        candleList: candleList
      };
    });

    res.json({
      success: true,
      data: {
        ...parsedSub,
        deliveries: parsedDeliveries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      planName,
      recipientName,
      recipientPhone,
      recipientAddress,
      deliveryCycle,
      budgetLimit,
      candlesPerDelivery = 2,
      deliveryScene,
      preferredAromas = [],
      excludedScents = [],
      specialDates = [],
      userNotes,
      startDate
    } = req.body;

    if (!planName || !recipientName || !recipientAddress || !deliveryCycle ||
        !budgetLimit || !deliveryScene || !startDate) {
      return res.status(400).json({ success: false, error: '请填写完整的订阅信息' });
    }

    if (!['weekly', 'biweekly', 'monthly'].includes(deliveryCycle)) {
      return res.status(400).json({ success: false, error: '无效的配送周期' });
    }

    if (budgetLimit <= 0) {
      return res.status(400).json({ success: false, error: '预算必须大于0' });
    }

    if (candlesPerDelivery < 1 || candlesPerDelivery > 10) {
      return res.status(400).json({ success: false, error: '每期蜡烛数量必须在1-10之间' });
    }

    const nextDeliveryDate = calculateNextDeliveryDate(startDate, deliveryCycle, 0);

    const subscriptionId = insert('subscription_plans', {
      plan_name: planName,
      recipient_name: recipientName,
      recipient_phone: recipientPhone || null,
      recipient_address: recipientAddress,
      delivery_cycle: deliveryCycle,
      budget_limit: budgetLimit,
      candles_per_delivery: candlesPerDelivery,
      delivery_scene: deliveryScene,
      preferred_aromas: JSON.stringify(preferredAromas),
      excluded_scents: JSON.stringify(excludedScents),
      special_dates: JSON.stringify(specialDates),
      user_notes: userNotes || null,
      start_date: startDate,
      next_delivery_date: nextDeliveryDate,
      status: 'active',
      total_deliveries: 0
    });

    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [subscriptionId]
    );

    res.json({ success: true, data: parseSubscription(subscription) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/pause', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ success: false, error: '只有活跃状态的订阅才能暂停' });
    }

    const changes = update(
      'subscription_plans',
      { status: 'paused' },
      'id = ?',
      [req.params.id]
    );

    if (changes === 0) {
      return res.status(500).json({ success: false, error: '暂停订阅失败' });
    }

    const updated = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: parseSubscription(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/resume', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({ success: false, error: '只有暂停状态的订阅才能恢复' });
    }

    const changes = update(
      'subscription_plans',
      { status: 'active' },
      'id = ?',
      [req.params.id]
    );

    if (changes === 0) {
      return res.status(500).json({ success: false, error: '恢复订阅失败' });
    }

    const updated = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: parseSubscription(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/cancel', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    if (subscription.status === 'cancelled' || subscription.status === 'completed') {
      return res.status(400).json({ success: false, error: '该订阅已取消或已完成' });
    }

    const changes = update(
      'subscription_plans',
      { status: 'cancelled', next_delivery_date: null },
      'id = ?',
      [req.params.id]
    );

    if (changes === 0) {
      return res.status(500).json({ success: false, error: '取消订阅失败' });
    }

    const updated = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: parseSubscription(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/generate-plan', (req, res) => {
  try {
    const plan = generateDeliveryPlan(req.params.id);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/confirm-delivery', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ success: false, error: '订阅未激活' });
    }

    const plan = generateDeliveryPlan(req.params.id);

    if (plan.candles.length === 0) {
      return res.status(400).json({ success: false, error: '无法生成配送方案，没有可用的蜡烛' });
    }

    const result = transaction(() => {
      const deliveryId = insert('subscription_deliveries', {
        subscription_id: subscription.id,
        delivery_number: plan.deliveryNumber,
        scheduled_date: plan.scheduledDate,
        actual_delivery_date: new Date().toISOString().split('T')[0],
        status: 'delivered',
        total_price: plan.totalPrice,
        candle_count: plan.candleCount,
        estimated_burn_days: plan.estimatedBurnDays,
        conflict_warnings: JSON.stringify(plan.conflictWarnings),
        out_of_stock_notes: plan.outOfStockNotes,
        delivery_notes: plan.deliveryNotes
      });

      for (const candle of plan.candles) {
        insert('delivery_contents', {
          delivery_id: deliveryId,
          candle_id: candle.id,
          quantity: 1,
          unit_price: candle.price,
          is_replacement: candle.isReplacement ? 1 : 0,
          original_candle_id: candle.originalCandleId || null,
          replacement_reason: candle.isReplacement ? '库存不足自动替换' : null,
          match_score: candle.matchScore
        });

        query(
          'UPDATE candles SET stock_quantity = stock_quantity - 1 WHERE id = ?',
          [candle.id]
        );
      }

      const nextDeliveryDate = calculateNextDeliveryDate(
        subscription.start_date,
        subscription.delivery_cycle,
        subscription.total_deliveries + 1
      );

      update(
        'subscription_plans',
        {
          total_deliveries: subscription.total_deliveries + 1,
          next_delivery_date: nextDeliveryDate
        },
        'id = ?',
        [subscription.id]
      );

      return deliveryId;
    });

    const delivery = queryOne(
      `SELECT sd.*,
              GROUP_CONCAT(c.name || '(' || dc.quantity || ')') as candle_list
       FROM subscription_deliveries sd
       LEFT JOIN delivery_contents dc ON sd.id = dc.delivery_id
       LEFT JOIN candles c ON dc.candle_id = c.id
       WHERE sd.id = ?
       GROUP BY sd.id`,
      [result]
    );

    const contents = query(
      `SELECT dc.*, c.name, c.english_name, c.aroma_family
       FROM delivery_contents dc
       JOIN candles c ON dc.candle_id = c.id
       WHERE dc.delivery_id = ?`,
      [result]
    );

    const candleList = delivery.candle_list ? delivery.candle_list.split(',') : [];
    const parsedContents = contents.map(c => addCamelCaseFields({
      ...c,
      match_score: parseFloat(c.match_score)
    }));
    
    res.json({
      success: true,
      data: {
        ...parseDelivery(delivery),
        candle_list: candleList,
        candleList: candleList,
        contents: parsedContents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/history', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    const deliveries = query(
      `SELECT sd.*
       FROM subscription_deliveries sd
       WHERE sd.subscription_id = ?
       ORDER BY sd.delivery_number DESC`,
      [req.params.id]
    );

    const history = [];
    for (const delivery of deliveries) {
      const contents = query(
        `SELECT dc.*, c.name, c.english_name, c.aroma_family, c.scent_notes
         FROM delivery_contents dc
         JOIN candles c ON dc.candle_id = c.id
         WHERE dc.delivery_id = ?`,
        [delivery.id]
      );

      history.push({
        ...parseDelivery(delivery),
        contents: contents.map(c => ({
          ...parseCandle(c),
          quantity: c.quantity,
          unitPrice: c.unit_price,
          isReplacement: c.is_replacement === 1,
          originalCandleId: c.original_candle_id,
          replacementReason: c.replacement_reason,
          matchScore: parseFloat(c.match_score)
        }))
      });
    }

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const subscription = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    if (!subscription) {
      return res.status(404).json({ success: false, error: '订阅计划不存在' });
    }

    const {
      planName,
      recipientName,
      recipientPhone,
      recipientAddress,
      deliveryCycle,
      budgetLimit,
      candlesPerDelivery,
      deliveryScene,
      preferredAromas,
      excludedScents,
      specialDates,
      userNotes
    } = req.body;

    const updateData = {};
    if (planName !== undefined) updateData.plan_name = planName;
    if (recipientName !== undefined) updateData.recipient_name = recipientName;
    if (recipientPhone !== undefined) updateData.recipient_phone = recipientPhone || null;
    if (recipientAddress !== undefined) updateData.recipient_address = recipientAddress;
    if (deliveryCycle !== undefined) {
      if (!['weekly', 'biweekly', 'monthly'].includes(deliveryCycle)) {
        return res.status(400).json({ success: false, error: '无效的配送周期' });
      }
      updateData.delivery_cycle = deliveryCycle;
    }
    if (budgetLimit !== undefined) {
      if (budgetLimit <= 0) {
        return res.status(400).json({ success: false, error: '预算必须大于0' });
      }
      updateData.budget_limit = budgetLimit;
    }
    if (candlesPerDelivery !== undefined) {
      if (candlesPerDelivery < 1 || candlesPerDelivery > 10) {
        return res.status(400).json({ success: false, error: '每期蜡烛数量必须在1-10之间' });
      }
      updateData.candles_per_delivery = candlesPerDelivery;
    }
    if (deliveryScene !== undefined) updateData.delivery_scene = deliveryScene;
    if (preferredAromas !== undefined) updateData.preferred_aromas = JSON.stringify(preferredAromas);
    if (excludedScents !== undefined) updateData.excluded_scents = JSON.stringify(excludedScents);
    if (specialDates !== undefined) updateData.special_dates = JSON.stringify(specialDates);
    if (userNotes !== undefined) updateData.user_notes = userNotes || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: '没有需要更新的字段' });
    }

    const changes = update(
      'subscription_plans',
      updateData,
      'id = ?',
      [req.params.id]
    );

    if (changes === 0) {
      return res.status(500).json({ success: false, error: '更新订阅失败' });
    }

    const updated = queryOne(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: parseSubscription(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
