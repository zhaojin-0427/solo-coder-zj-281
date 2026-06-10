import { query, queryOne, insert, update, remove, transaction } from '../db/index.js';

const TABLES = {
  PLANS: 'tolerance_plans',
  PHASES: 'tolerance_plan_phases',
  FEEDBACK: 'tolerance_plan_daily_feedback',
  INTERRUPTIONS: 'tolerance_plan_interruptions'
};

function findPlans({ sourceType, sourceId, status } = {}) {
  let sql = `
    SELECT tp.*,
           COUNT(tpp.id) as total_phases,
           SUM(CASE WHEN tpp.status = 'completed' THEN 1 ELSE 0 END) as completed_phases
    FROM tolerance_plans tp
    LEFT JOIN tolerance_plan_phases tpp ON tp.id = tpp.plan_id
    WHERE 1=1
  `;
  
  const params = [];

  if (sourceType) {
    sql += ' AND tp.source_type = ?';
    params.push(sourceType);
  }
  if (sourceId) {
    sql += ' AND tp.source_id = ?';
    params.push(sourceId);
  }
  if (status) {
    sql += ' AND tp.status = ?';
    params.push(status);
  }

  sql += ' GROUP BY tp.id ORDER BY tp.created_at DESC';

  return query(sql, params);
}

function findPlanById(id) {
  return queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [id]);
}

function findPhasesByPlanId(planId) {
  return query(`
    SELECT * FROM tolerance_plan_phases 
    WHERE plan_id = ? 
    ORDER BY phase_number ASC
  `, [planId]);
}

function findPhaseById(phaseId, planId) {
  return queryOne(`
    SELECT * FROM tolerance_plan_phases 
    WHERE id = ? AND plan_id = ?
  `, [phaseId, planId]);
}

function findPhaseByIdOnly(phaseId) {
  return queryOne('SELECT * FROM tolerance_plan_phases WHERE id = ?', [phaseId]);
}

function findFeedbacksByPlanId(planId, limit = 60) {
  return query(`
    SELECT * FROM tolerance_plan_daily_feedback 
    WHERE plan_id = ? 
    ORDER BY feedback_date DESC
    LIMIT ?
  `, [planId, limit]);
}

function findFeedbackByUniqueKey(planId, phaseId, feedbackDate) {
  return queryOne(`
    SELECT * FROM tolerance_plan_daily_feedback 
    WHERE plan_id = ? AND phase_id = ? AND feedback_date = ?
  `, [planId, phaseId, feedbackDate]);
}

function findFeedbackById(id) {
  return queryOne('SELECT * FROM tolerance_plan_daily_feedback WHERE id = ?', [id]);
}

function findFeedbacksByPhaseId(phaseId) {
  return query(`
    SELECT * FROM tolerance_plan_daily_feedback 
    WHERE phase_id = ? AND used = 1
    ORDER BY feedback_date ASC
  `, [phaseId]);
}

function countFeedbacksByPhaseId(phaseId) {
  const result = queryOne(`
    SELECT COUNT(*) as count FROM tolerance_plan_daily_feedback 
    WHERE phase_id = ? AND used = 1
  `, [phaseId]);
  return result?.count || 0;
}

function findInterruptionsByPlanId(planId) {
  return query(`
    SELECT * FROM tolerance_plan_interruptions 
    WHERE plan_id = ? 
    ORDER BY interruption_date DESC
  `, [planId]);
}

function findInterruptionById(interruptionId, planId) {
  return queryOne(`
    SELECT * FROM tolerance_plan_interruptions 
    WHERE id = ? AND plan_id = ?
  `, [interruptionId, planId]);
}

function findInterruptionByIdOnly(interruptionId) {
  return queryOne('SELECT * FROM tolerance_plan_interruptions WHERE id = ?', [interruptionId]);
}

function findInterruptionsByPhaseId(phaseId, severities) {
  let sql = `
    SELECT * FROM tolerance_plan_interruptions 
    WHERE phase_id = ?
  `;
  const params = [phaseId];
  
  if (severities && severities.length > 0) {
    const placeholders = severities.map(() => '?').join(', ');
    sql += ` AND severity IN (${placeholders})`;
    params.push(...severities);
  }
  
  return query(sql, params);
}

function createPlan(planData) {
  return insert(TABLES.PLANS, planData);
}

function createPhase(phaseData) {
  return insert(TABLES.PHASES, phaseData);
}

function createFeedback(feedbackData) {
  return insert(TABLES.FEEDBACK, feedbackData);
}

function createInterruption(interruptionData) {
  return insert(TABLES.INTERRUPTIONS, interruptionData);
}

function updatePlan(id, data) {
  return update(TABLES.PLANS, data, 'id = ?', [id]);
}

function updatePhase(id, data) {
  return update(TABLES.PHASES, data, 'id = ?', [id]);
}

function updateFeedback(id, data) {
  return update(TABLES.FEEDBACK, data, 'id = ?', [id]);
}

function updateInterruption(id, data) {
  return update(TABLES.INTERRUPTIONS, data, 'id = ?', [id]);
}

function deletePlan(id) {
  return remove(TABLES.PLANS, 'id = ?', [id]);
}

function findNextPhase(planId, currentPhaseNumber) {
  return queryOne(`
    SELECT * FROM tolerance_plan_phases 
    WHERE plan_id = ? AND phase_number > ? 
    ORDER BY phase_number ASC
    LIMIT 1
  `, [planId, currentPhaseNumber]);
}

function getStatsSummary() {
  return queryOne(`
    SELECT 
      COUNT(*) as total_plans,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_plans,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_plans,
      SUM(CASE WHEN status = 'interrupted' THEN 1 ELSE 0 END) as interrupted_plans,
      SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_plans,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_plans,
      AVG(progress_percent) as avg_progress
    FROM tolerance_plans
  `);
}

function countTodayFeedbacks(date) {
  const result = queryOne(`
    SELECT COUNT(*) as today_feedback_count
    FROM tolerance_plan_daily_feedback
    WHERE feedback_date = ?
  `, [date]);
  return result?.today_feedback_count || 0;
}

function executeInTransaction(fn) {
  return transaction(fn);
}

export {
  findPlans,
  findPlanById,
  findPhasesByPlanId,
  findPhaseById,
  findPhaseByIdOnly,
  findFeedbacksByPlanId,
  findFeedbackByUniqueKey,
  findFeedbackById,
  findFeedbacksByPhaseId,
  countFeedbacksByPhaseId,
  findInterruptionsByPlanId,
  findInterruptionById,
  findInterruptionByIdOnly,
  findInterruptionsByPhaseId,
  findNextPhase,
  createPlan,
  createPhase,
  createFeedback,
  createInterruption,
  updatePlan,
  updatePhase,
  updateFeedback,
  updateInterruption,
  deletePlan,
  getStatsSummary,
  countTodayFeedbacks,
  executeInTransaction
};
