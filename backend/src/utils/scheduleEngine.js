import { query, queryOne } from '../db/index.js';

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

function parseSchedule(schedule) {
  if (!schedule) return null;
  const parsed = {
    ...schedule,
    frequency_days: JSON.parse(schedule.frequency_days || '[]')
  };
  const withCamel = addCamelCaseFields(parsed);
  withCamel.frequencyDays = parsed.frequency_days;
  withCamel.reminderEnabled = schedule.reminder_enabled === 1;
  return withCamel;
}

function parseCompletion(completion) {
  if (!completion) return null;
  return addCamelCaseFields(completion);
}

function generateScheduleOccurrences(schedule, startDate, endDate) {
  const occurrences = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const scheduleStart = new Date(schedule.start_date);
  const scheduleEnd = schedule.end_date ? new Date(schedule.end_date) : null;

  const effectiveStart = new Date(Math.max(start.getTime(), scheduleStart.getTime()));
  const effectiveEnd = scheduleEnd 
    ? new Date(Math.min(end.getTime(), scheduleEnd.getTime()))
    : end;

  if (effectiveStart > effectiveEnd) return [];

  const current = new Date(effectiveStart);

  while (current <= effectiveEnd) {
    const shouldInclude = checkFrequencyMatch(current, schedule);
    
    if (shouldInclude) {
      const dateStr = current.toISOString().split('T')[0];
      occurrences.push({
        ...schedule,
        scheduledDate: dateStr,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return occurrences;
}

function checkFrequencyMatch(date, schedule) {
  const frequencyType = schedule.frequency_type || schedule.frequencyType;
  const frequencyValue = schedule.frequency_value || schedule.frequencyValue || 1;
  const frequencyDays = schedule.frequency_days || schedule.frequencyDays || [];
  
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  switch (frequencyType) {
    case 'daily':
      return true;
    
    case 'weekly':
      if (frequencyDays.length > 0) {
        return frequencyDays.includes(dayOfWeek);
      }
      const startDate = new Date(schedule.start_date || schedule.startDate);
      const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
      return daysDiff % (7 / frequencyValue) === 0;
    
    case 'monthly':
      const startDay = new Date(schedule.start_date || schedule.startDate).getDate();
      return dayOfMonth === startDay;
    
    case 'custom':
      const customStart = new Date(schedule.start_date || schedule.startDate);
      const customDaysDiff = Math.floor((date - customStart) / (1000 * 60 * 60 * 24));
      return customDaysDiff % frequencyValue === 0;
    
    default:
      return false;
  }
}

function getSchedulesInRange(startDate, endDate, filters = {}) {
  let sql = `
    SELECT s.*,
           f.name as formula_name,
           f.id as formula_id,
           sp.plan_name as subscription_name,
           sp.id as subscription_id
    FROM schedules s
    LEFT JOIN formulas f ON s.formula_id = f.id
    LEFT JOIN subscription_plans sp ON s.subscription_id = sp.id
    WHERE s.status = 'active'
      AND s.start_date <= ?
      AND (s.end_date IS NULL OR s.end_date >= ?)
  `;
  
  const params = [endDate, startDate];

  if (filters.sourceType) {
    sql += ' AND s.source_type = ?';
    params.push(filters.sourceType);
  }
  if (filters.formulaId) {
    sql += ' AND s.formula_id = ?';
    params.push(filters.formulaId);
  }
  if (filters.subscriptionId) {
    sql += ' AND s.subscription_id = ?';
    params.push(filters.subscriptionId);
  }

  sql += ' ORDER BY s.created_at DESC';

  const schedules = query(sql, params);
  const parsedSchedules = schedules.map(parseSchedule);

  const allOccurrences = [];
  for (const schedule of parsedSchedules) {
    const occurrences = generateScheduleOccurrences(schedule, startDate, endDate);
    allOccurrences.push(...occurrences);
  }

  return allOccurrences.sort((a, b) => 
    new Date(a.scheduledDate) - new Date(b.scheduledDate)
  );
}

function getTodayReminders() {
  const today = new Date().toISOString().split('T')[0];
  const occurrences = getSchedulesInRange(today, today);
  
  const completedToday = query(`
    SELECT sc.*, s.title as schedule_title
    FROM schedule_completions sc
    JOIN schedules s ON sc.schedule_id = s.id
    WHERE sc.scheduled_date = ?
  `, [today]);

  const completedScheduleIds = new Set(completedToday.map(c => c.schedule_id));

  const reminders = occurrences.map(occurrence => ({
    ...occurrence,
    isCompleted: completedScheduleIds.has(occurrence.id),
    completion: completedToday.find(c => c.schedule_id === occurrence.id)
  }));

  return {
    date: today,
    total: reminders.length,
    completed: reminders.filter(r => r.isCompleted).length,
    pending: reminders.filter(r => !r.isCompleted).length,
    reminders
  };
}

function detectHighSensitivityRisk() {
  const risks = [];
  
  const highSensitivities = query(`
    SELECT 
      s.id as schedule_id,
      s.title as schedule_title,
      s.usage_part,
      s.frequency_type,
      f.id as formula_id,
      f.name as formula_name,
      COUNT(DISTINCT ir.id) as sensitivity_count,
      AVG(ir.sensitivity) as avg_sensitivity,
      GROUP_CONCAT(DISTINCT i.name) as sensitive_ingredients
    FROM schedules s
    JOIN formulas f ON s.formula_id = f.id
    JOIN formula_ingredients fi ON f.id = fi.formula_id
    JOIN ingredients i ON fi.ingredient_id = i.id
    LEFT JOIN ingredient_reactions ir ON i.id = ir.ingredient_id
    WHERE s.status = 'active'
      AND s.frequency_type IN ('daily', 'weekly')
      AND i.safety_level >= 3
    GROUP BY s.id, f.id
    HAVING avg_sensitivity >= 3 OR sensitivity_count >= 2
  `);

  for (const sens of highSensitivities) {
    const recentCompletions = query(`
      SELECT COUNT(*) as count
      FROM schedule_completions
      WHERE schedule_id = ?
        AND scheduled_date >= DATE('now', '-7 days')
    `, [sens.schedule_id]);

    const weeklyUseCount = recentCompletions[0]?.count || 0;
    const isHighFrequency = weeklyUseCount >= 4 || sens.frequency_type === 'daily';

    if (isHighFrequency) {
      risks.push({
        type: 'high_sensitivity',
        level: 'danger',
        scheduleId: sens.schedule_id,
        scheduleTitle: sens.schedule_title,
        formulaId: sens.formula_id,
        formulaName: sens.formula_name,
        usagePart: sens.usage_part,
        frequencyType: sens.frequency_type,
        weeklyUseCount,
        avgSensitivity: Math.round(sens.avg_sensitivity * 10) / 10,
        sensitivityCount: sens.sensitivity_count,
        sensitiveIngredients: sens.sensitive_ingredients ? sens.sensitive_ingredients.split(',') : [],
        message: `「${sens.formula_name}」含有高敏感成分${sens.sensitive_ingredients || ''}，近7天使用${weeklyUseCount}次，建议减少使用频率或更换配方`
      });
    }
  }

  return risks;
}

function detectSubscriptionReviewRisk() {
  const risks = [];
  
  const upcomingDeliveries = query(`
    SELECT 
      sp.id as subscription_id,
      sp.plan_name,
      sp.next_delivery_date,
      COUNT(DISTINCT sd.id) as total_deliveries,
      COUNT(DISTINCT CASE WHEN ur.id IS NULL THEN 1 END) as unreviewed_deliveries
    FROM subscription_plans sp
    LEFT JOIN subscription_deliveries sd ON sp.id = sd.subscription_id
    LEFT JOIN usage_records ur ON ur.created_at >= sd.actual_delivery_date
      AND ur.created_at <= DATE(sd.actual_delivery_date, '+14 days')
    WHERE sp.status = 'active'
      AND sp.next_delivery_date IS NOT NULL
      AND sp.next_delivery_date <= DATE('now', '+7 days')
    GROUP BY sp.id
    HAVING unreviewed_deliveries > 0
  `);

  for (const delivery of upcomingDeliveries) {
    const schedule = queryOne(`
      SELECT * FROM schedules 
      WHERE subscription_id = ? AND status = 'active'
      LIMIT 1
    `, [delivery.subscription_id]);

    const daysUntilDelivery = Math.ceil(
      (new Date(delivery.next_delivery_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    risks.push({
      type: 'subscription_review',
      level: 'warning',
      subscriptionId: delivery.subscription_id,
      scheduleId: schedule?.id,
      planName: delivery.plan_name,
      nextDeliveryDate: delivery.next_delivery_date,
      daysUntilDelivery,
      unreviewedDeliveries: delivery.unreviewed_deliveries,
      message: `订阅「${delivery.plan_name}」将在${daysUntilDelivery}天后配送，还有${delivery.unreviewed_deliveries}个礼盒未完成使用复盘，请及时记录反馈`
    });
  }

  return risks;
}

function detectLongTermNoFeedbackRisk() {
  const risks = [];
  
  const schedulesWithoutFeedback = query(`
    SELECT 
      s.id as schedule_id,
      s.title as schedule_title,
      s.source_type,
      s.start_date,
      f.id as formula_id,
      f.name as formula_name,
      COUNT(sc.id) as completion_count,
      MAX(sc.scheduled_date) as last_completion_date,
      COUNT(ur.id) as feedback_count
    FROM schedules s
    LEFT JOIN formulas f ON s.formula_id = f.id
    LEFT JOIN schedule_completions sc ON s.id = sc.schedule_id
    LEFT JOIN usage_records ur ON ur.formula_id = s.formula_id
      AND ur.date >= sc.scheduled_date
    WHERE s.status = 'active'
    GROUP BY s.id
    HAVING completion_count >= 3 AND feedback_count = 0
  `);

  for (const s of schedulesWithoutFeedback) {
    const daysSinceStart = Math.ceil(
      (new Date() - new Date(s.start_date)) / (1000 * 60 * 60 * 24)
    );

    const lastCompletion = s.last_completion_date 
      ? Math.ceil((new Date() - new Date(s.last_completion_date)) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceStart >= 14 || (lastCompletion && lastCompletion >= 7)) {
      risks.push({
        type: 'no_feedback',
        level: 'info',
        scheduleId: s.schedule_id,
        scheduleTitle: s.schedule_title,
        sourceType: s.source_type,
        formulaId: s.formula_id,
        formulaName: s.formula_name,
        completionCount: s.completion_count,
        lastCompletionDate: s.last_completion_date,
        daysSinceStart,
        message: `「${s.schedule_title}」已打卡${s.completion_count}次但尚未记录使用反馈，建议添加详细使用记录以获得更精准的肤质分析`
      });
    }
  }

  return risks;
}

function detectFormulaUsageConflictRisk() {
  const risks = [];
  
  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = getSchedulesInRange(today, today);
  const formulaIds = todaySchedules
    .filter(s => s.formula_id)
    .map(s => s.formula_id);

  if (formulaIds.length >= 2) {
    const formulaDetails = query(`
      SELECT 
        f.id,
        f.name,
        GROUP_CONCAT(DISTINCT i.name) as ingredients,
        GROUP_CONCAT(DISTINCT i.contraindications) as contraindications
      FROM formulas f
      JOIN formula_ingredients fi ON f.id = fi.formula_id
      JOIN ingredients i ON fi.ingredient_id = i.id
      WHERE f.id IN (${formulaIds.map(() => '?').join(',')})
      GROUP BY f.id
    `, formulaIds);

    const highRiskFormulas = formulaDetails.filter(f => {
      try {
        const contra = JSON.parse(f.contraindications || '[]');
        return contra.length > 0;
      } catch {
        return false;
      }
    });

    if (highRiskFormulas.length >= 2) {
      risks.push({
        type: 'usage_conflict',
        level: 'warning',
        formulaIds: highRiskFormulas.map(f => f.id),
        formulaNames: highRiskFormulas.map(f => f.name),
        message: `今日计划使用多个配方（${highRiskFormulas.map(f => f.name).join('、')}），请注意成分搭配，避免叠加使用高风险配方`
      });
    }
  }

  return risks;
}

function getRiskWarnings() {
  const allRisks = [
    ...detectHighSensitivityRisk(),
    ...detectSubscriptionReviewRisk(),
    ...detectLongTermNoFeedbackRisk(),
    ...detectFormulaUsageConflictRisk()
  ];

  return {
    total: allRisks.length,
    dangerCount: allRisks.filter(r => r.level === 'danger').length,
    warningCount: allRisks.filter(r => r.level === 'warning').length,
    infoCount: allRisks.filter(r => r.level === 'info').length,
    risks: allRisks.sort((a, b) => {
      const levelOrder = { danger: 0, warning: 1, info: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    })
  };
}

function getCalendarView(startDate, endDate, filters = {}) {
  const occurrences = getSchedulesInRange(startDate, endDate, filters);
  
  const dateMap = new Map();
  
  for (const occurrence of occurrences) {
    const date = occurrence.scheduledDate;
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date).push(occurrence);
  }

  const calendarDays = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const schedules = dateMap.get(dateStr) || [];
    
    calendarDays.push({
      date: dateStr,
      weekday: current.getDay(),
      isToday: dateStr === new Date().toISOString().split('T')[0],
      hasSchedules: schedules.length > 0,
      scheduleCount: schedules.length,
      schedules
    });

    current.setDate(current.getDate() + 1);
  }

  return calendarDays;
}

function getNext30DaysCalendar(filters = {}) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 29);
  
  return getCalendarView(
    today.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    filters
  );
}

export {
  parseSchedule,
  parseCompletion,
  generateScheduleOccurrences,
  getSchedulesInRange,
  getTodayReminders,
  detectHighSensitivityRisk,
  detectSubscriptionReviewRisk,
  detectLongTermNoFeedbackRisk,
  detectFormulaUsageConflictRisk,
  getRiskWarnings,
  getCalendarView,
  getNext30DaysCalendar
};

export default {
  parseSchedule,
  parseCompletion,
  generateScheduleOccurrences,
  getSchedulesInRange,
  getTodayReminders,
  detectHighSensitivityRisk,
  detectSubscriptionReviewRisk,
  detectLongTermNoFeedbackRisk,
  detectFormulaUsageConflictRisk,
  getRiskWarnings,
  getCalendarView,
  getNext30DaysCalendar
};
