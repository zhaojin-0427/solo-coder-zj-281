import express from 'express';
import { query, queryOne, insert, update, remove } from '../db/index.js';
import {
  parseSchedule,
  parseCompletion,
  getTodayReminders,
  getRiskWarnings,
  getCalendarView,
  getNext30DaysCalendar,
  getSchedulesInRange
} from '../utils/scheduleEngine.js';

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

router.get('/', (req, res) => {
  try {
    const { sourceType, formulaId, subscriptionId, status } = req.query;
    
    let sql = `
      SELECT s.*,
             f.name as formula_name,
             f.id as formula_id,
             sp.plan_name as subscription_name,
             sp.id as subscription_id,
             COUNT(sc.id) as completion_count,
             MAX(sc.scheduled_date) as last_completion_date
      FROM schedules s
      LEFT JOIN formulas f ON s.formula_id = f.id
      LEFT JOIN subscription_plans sp ON s.subscription_id = sp.id
      LEFT JOIN schedule_completions sc ON s.id = sc.schedule_id
      WHERE 1=1
    `;
    
    const params = [];

    if (sourceType) {
      sql += ' AND s.source_type = ?';
      params.push(sourceType);
    }
    if (formulaId) {
      sql += ' AND s.formula_id = ?';
      params.push(formulaId);
    }
    if (subscriptionId) {
      sql += ' AND s.subscription_id = ?';
      params.push(subscriptionId);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY s.id ORDER BY s.created_at DESC';

    const schedules = query(sql, params);
    const parsed = schedules.map(s => {
      const schedule = parseSchedule(s);
      schedule.completionCount = s.completion_count || 0;
      schedule.lastCompletionDate = s.last_completion_date;
      schedule.formulaName = s.formula_name;
      schedule.subscriptionName = s.subscription_name;
      return schedule;
    });

    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const schedule = queryOne(`
      SELECT s.*,
             f.name as formula_name,
             sp.plan_name as subscription_name
      FROM schedules s
      LEFT JOIN formulas f ON s.formula_id = f.id
      LEFT JOIN subscription_plans sp ON s.subscription_id = sp.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!schedule) {
      return res.status(404).json({ success: false, error: '日程不存在' });
    }

    const completions = query(`
      SELECT * FROM schedule_completions 
      WHERE schedule_id = ? 
      ORDER BY scheduled_date DESC
      LIMIT 30
    `, [req.params.id]);

    const parsed = parseSchedule(schedule);
    parsed.formulaName = schedule.formula_name;
    parsed.subscriptionName = schedule.subscription_name;
    parsed.completions = completions.map(parseCompletion);

    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      title,
      description,
      sourceType,
      sourceId,
      usagePart,
      frequencyType,
      frequencyValue = 1,
      frequencyDays = [],
      startDate,
      endDate,
      reminderTime,
      reminderEnabled = true,
      formulaId,
      subscriptionId,
      status = 'active'
    } = req.body;

    if (!title || !sourceType || !frequencyType || !startDate) {
      return res.status(400).json({ success: false, error: '请填写必填字段' });
    }

    if (!['formula', 'record', 'subscription'].includes(sourceType)) {
      return res.status(400).json({ success: false, error: '无效的来源类型' });
    }

    if (!['daily', 'weekly', 'monthly', 'custom'].includes(frequencyType)) {
      return res.status(400).json({ success: false, error: '无效的频率类型' });
    }

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: '无效的状态' });
    }

    const scheduleId = insert('schedules', {
      title,
      description: description || null,
      source_type: sourceType,
      source_id: sourceId || null,
      usage_part: usagePart || null,
      frequency_type: frequencyType,
      frequency_value: frequencyValue,
      frequency_days: JSON.stringify(frequencyDays),
      start_date: startDate,
      end_date: endDate || null,
      reminder_time: reminderTime || null,
      reminder_enabled: reminderEnabled ? 1 : 0,
      formula_id: formulaId || null,
      subscription_id: subscriptionId || null,
      status
    });

    const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [scheduleId]);
    res.json({ success: true, data: parseSchedule(schedule) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '日程不存在' });
    }

    const {
      title,
      description,
      sourceType,
      sourceId,
      usagePart,
      frequencyType,
      frequencyValue,
      frequencyDays,
      startDate,
      endDate,
      reminderTime,
      reminderEnabled,
      formulaId,
      subscriptionId,
      status
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (sourceType !== undefined) {
      if (!['formula', 'record', 'subscription'].includes(sourceType)) {
        return res.status(400).json({ success: false, error: '无效的来源类型' });
      }
      updateData.source_type = sourceType;
    }
    if (sourceId !== undefined) updateData.source_id = sourceId || null;
    if (usagePart !== undefined) updateData.usage_part = usagePart || null;
    if (frequencyType !== undefined) {
      if (!['daily', 'weekly', 'monthly', 'custom'].includes(frequencyType)) {
        return res.status(400).json({ success: false, error: '无效的频率类型' });
      }
      updateData.frequency_type = frequencyType;
    }
    if (frequencyValue !== undefined) updateData.frequency_value = frequencyValue;
    if (frequencyDays !== undefined) updateData.frequency_days = JSON.stringify(frequencyDays);
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate || null;
    if (reminderTime !== undefined) updateData.reminder_time = reminderTime || null;
    if (reminderEnabled !== undefined) updateData.reminder_enabled = reminderEnabled ? 1 : 0;
    if (formulaId !== undefined) updateData.formula_id = formulaId || null;
    if (subscriptionId !== undefined) updateData.subscription_id = subscriptionId || null;
    if (status !== undefined) {
      if (!['active', 'paused', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, error: '无效的状态' });
      }
      updateData.status = status;
    }
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: '没有需要更新的字段' });
    }

    const changes = update('schedules', updateData, 'id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(500).json({ success: false, error: '更新日程失败' });
    }

    const updated = queryOne('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: parseSchedule(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '日程不存在' });
    }

    const changes = remove('schedules', 'id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(500).json({ success: false, error: '删除日程失败' });
    }

    res.json({ success: true, data: { id: parseInt(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/today/reminders', (req, res) => {
  try {
    const reminders = getTodayReminders();
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/risks/warnings', (req, res) => {
  try {
    const warnings = getRiskWarnings();
    res.json({ success: true, data: warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/calendar/view', (req, res) => {
  try {
    const { startDate, endDate, sourceType, formulaId, subscriptionId } = req.query;
    
    const today = new Date();
    const defaultStart = today.toISOString().split('T')[0];
    const defaultEnd = new Date(today.setDate(today.getDate() + 29)).toISOString().split('T')[0];

    const filters = { sourceType, formulaId, subscriptionId };
    const calendar = getCalendarView(
      startDate || defaultStart,
      endDate || defaultEnd,
      filters
    );

    res.json({ success: true, data: calendar });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/calendar/next30', (req, res) => {
  try {
    const { sourceType, formulaId, subscriptionId } = req.query;
    const filters = { sourceType, formulaId, subscriptionId };
    const calendar = getNext30DaysCalendar(filters);
    res.json({ success: true, data: calendar });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/complete', (req, res) => {
  try {
    const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!schedule) {
      return res.status(404).json({ success: false, error: '日程不存在' });
    }

    const { scheduledDate, notes, rating } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const date = scheduledDate || today;

    const existingCompletion = queryOne(`
      SELECT * FROM schedule_completions 
      WHERE schedule_id = ? AND scheduled_date = ?
    `, [req.params.id, date]);

    let completionId;
    if (existingCompletion) {
      const changes = update('schedule_completions', {
        notes: notes || null,
        rating: rating || null,
        completed_at: new Date().toISOString()
      }, 'id = ?', [existingCompletion.id]);
      
      if (changes === 0) {
        return res.status(500).json({ success: false, error: '更新打卡记录失败' });
      }
      completionId = existingCompletion.id;
    } else {
      completionId = insert('schedule_completions', {
        schedule_id: parseInt(req.params.id),
        scheduled_date: date,
        notes: notes || null,
        rating: rating || null
      });
    }

    const completion = queryOne('SELECT * FROM schedule_completions WHERE id = ?', [completionId]);
    res.json({ success: true, data: parseCompletion(completion) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id/complete', (req, res) => {
  try {
    const { scheduledDate } = req.query;
    const date = scheduledDate || new Date().toISOString().split('T')[0];

    const completion = queryOne(`
      SELECT * FROM schedule_completions 
      WHERE schedule_id = ? AND scheduled_date = ?
    `, [req.params.id, date]);

    if (!completion) {
      return res.status(404).json({ success: false, error: '打卡记录不存在' });
    }

    const changes = remove('schedule_completions', 'id = ?', [completion.id]);
    if (changes === 0) {
      return res.status(500).json({ success: false, error: '取消打卡失败' });
    }

    res.json({ success: true, data: { message: '已取消打卡' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/range', (req, res) => {
  try {
    const { startDate, endDate, sourceType, formulaId, subscriptionId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: '请提供开始和结束日期' });
    }

    const filters = { sourceType, formulaId, subscriptionId };
    const occurrences = getSchedulesInRange(startDate, endDate, filters);

    res.json({ success: true, data: occurrences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
