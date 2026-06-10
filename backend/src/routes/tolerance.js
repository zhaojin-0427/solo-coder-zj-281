import express from 'express';
import { query, queryOne, insert, update, remove, transaction } from '../db/index.js';
import {
  parseTolerancePlan,
  parseTolerancePhase,
  parseDailyFeedback,
  parseInterruption,
  generatePlanConfig,
  evaluatePhaseCompletion,
  evaluateFinalResult,
  calculatePlanProgress,
  getCurrentPhase,
  checkForPauseConditions
} from '../utils/toleranceEngine.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { sourceType, sourceId, status } = req.query;
    
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

    const plans = query(sql, params);
    const parsed = plans.map(plan => {
      const parsedPlan = parseTolerancePlan(plan);
      parsedPlan.totalPhases = plan.total_phases || 0;
      parsedPlan.completedPhases = plan.completed_phases || 0;
      return parsedPlan;
    });

    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/preview', (req, res) => {
  try {
    const { sourceType, sourceId, cycleType, customDays, startDate, initialFrequency, initialDrops, skinSensitivityLevel } = req.query;
    
    if (!sourceType || !sourceId) {
      return res.status(400).json({ success: false, error: '请提供来源类型和来源ID' });
    }

    const config = generatePlanConfig(sourceType, Number(sourceId), {
      cycleType: cycleType || undefined,
      customDays: customDays ? Number(customDays) : undefined,
      startDate: startDate || undefined,
      initialFrequency: initialFrequency || undefined,
      initialDrops: initialDrops ? Number(initialDrops) : undefined,
      skinSensitivityLevel: skinSensitivityLevel ? Number(skinSensitivityLevel) : undefined
    });

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [req.params.id]);
    
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const phases = query(`
      SELECT * FROM tolerance_plan_phases 
      WHERE plan_id = ? 
      ORDER BY phase_number ASC
    `, [req.params.id]);

    const feedbacks = query(`
      SELECT * FROM tolerance_plan_daily_feedback 
      WHERE plan_id = ? 
      ORDER BY feedback_date DESC
      LIMIT 60
    `, [req.params.id]);

    const interruptions = query(`
      SELECT * FROM tolerance_plan_interruptions 
      WHERE plan_id = ? 
      ORDER BY interruption_date DESC
    `, [req.params.id]);

    const currentPhase = getCurrentPhase(Number(req.params.id));
    const progress = calculatePlanProgress(Number(req.params.id));

    const parsedPlan = parseTolerancePlan(plan);
    parsedPlan.phases = phases.map(parseTolerancePhase);
    parsedPlan.feedbacks = feedbacks.map(parseDailyFeedback);
    parsedPlan.interruptions = interruptions.map(parseInterruption);
    parsedPlan.currentPhase = currentPhase;
    parsedPlan.progressPercent = progress;

    res.json({ success: true, data: parsedPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      sourceType,
      sourceId,
      cycleType,
      customDays,
      startDate,
      initialFrequency,
      initialDrops,
      observationIndicators = [],
      phaseGoals = [],
      skinSensitivityLevel,
      notes
    } = req.body;

    if (!sourceType || !sourceId || !cycleType || !startDate || !initialFrequency || !initialDrops) {
      return res.status(400).json({ success: false, error: '请填写必填字段' });
    }

    if (!['formula', 'ingredient'].includes(sourceType)) {
      return res.status(400).json({ success: false, error: '无效的来源类型' });
    }

    if (!['7days', '14days', 'custom'].includes(cycleType)) {
      return res.status(400).json({ success: false, error: '无效的周期类型' });
    }

    if (cycleType === 'custom' && (!customDays || customDays < 7 || customDays > 60)) {
      return res.status(400).json({ success: false, error: '自定义周期必须在7-60天之间' });
    }

    const planConfig = generatePlanConfig(sourceType, Number(sourceId), {
      cycleType,
      customDays: customDays ? Number(customDays) : undefined,
      startDate,
      initialFrequency,
      initialDrops: Number(initialDrops),
      observationIndicators,
      phaseGoals,
      skinSensitivityLevel: skinSensitivityLevel ? Number(skinSensitivityLevel) : undefined,
      notes
    });

    const planId = transaction(() => {
      const id = insert('tolerance_plans', {
        name: planConfig.name,
        source_type: planConfig.sourceType,
        source_id: planConfig.sourceId,
        source_name: planConfig.sourceName,
        cycle_type: planConfig.cycleType,
        custom_days: planConfig.customDays,
        total_days: planConfig.totalDays,
        start_date: planConfig.startDate,
        end_date: planConfig.endDate,
        initial_frequency: planConfig.initialFrequency,
        initial_drops: planConfig.initialDrops,
        observation_indicators: JSON.stringify(planConfig.observationIndicators),
        phase_goals: JSON.stringify(planConfig.phaseGoals),
        skin_sensitivity_level: planConfig.skinSensitivityLevel,
        status: 'active',
        current_phase: 1,
        progress_percent: 0,
        notes: planConfig.notes
      });

      planConfig.phases.forEach(phase => {
        insert('tolerance_plan_phases', {
          plan_id: id,
          phase_number: phase.phaseNumber,
          name: phase.name,
          description: phase.description,
          start_date: phase.startDate,
          end_date: phase.endDate,
          duration_days: phase.durationDays,
          frequency: phase.frequency,
          drops: phase.drops,
          goals: JSON.stringify(phase.goals),
          status: phase.phaseNumber === 1 ? 'in_progress' : 'pending',
          pause_conditions: JSON.stringify(phase.pauseConditions)
        });
      });

      return id;
    });

    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [planId]);
    res.json({ success: true, data: parseTolerancePlan(plan) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const { name, notes, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes || null;
    if (status !== undefined) {
      if (!['active', 'paused', 'completed', 'interrupted', 'failed'].includes(status)) {
        return res.status(400).json({ success: false, error: '无效的状态' });
      }
      updateData.status = status;
    }
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: '没有需要更新的字段' });
    }

    const changes = update('tolerance_plans', updateData, 'id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(500).json({ success: false, error: '更新耐受计划失败' });
    }

    const updated = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: parseTolerancePlan(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const changes = remove('tolerance_plans', 'id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(500).json({ success: false, error: '删除耐受计划失败' });
    }

    res.json({ success: true, data: { id: parseInt(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/feedback', (req, res) => {
  try {
    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const { phaseId, feedbackDate, used, actualDrops, skinCondition, reactions = [], sensitivity, comfort, absorption, notes } = req.body;

    if (!phaseId || !feedbackDate) {
      return res.status(400).json({ success: false, error: '请提供阶段ID和反馈日期' });
    }

    const phase = queryOne('SELECT * FROM tolerance_plan_phases WHERE id = ? AND plan_id = ?', [phaseId, req.params.id]);
    if (!phase) {
      return res.status(404).json({ success: false, error: '阶段不存在' });
    }

    const existingFeedback = queryOne(`
      SELECT * FROM tolerance_plan_daily_feedback 
      WHERE plan_id = ? AND phase_id = ? AND feedback_date = ?
    `, [req.params.id, phaseId, feedbackDate]);

    let feedbackId;
    if (existingFeedback) {
      const changes = update('tolerance_plan_daily_feedback', {
        used: used ? 1 : 0,
        actual_drops: actualDrops ? Number(actualDrops) : null,
        skin_condition: skinCondition || null,
        reactions: JSON.stringify(reactions),
        sensitivity: sensitivity ? Number(sensitivity) : null,
        comfort: comfort ? Number(comfort) : null,
        absorption: absorption ? Number(absorption) : null,
        notes: notes || null
      }, 'id = ?', [existingFeedback.id]);
      
      if (changes === 0) {
        return res.status(500).json({ success: false, error: '更新反馈失败' });
      }
      feedbackId = existingFeedback.id;
    } else {
      feedbackId = insert('tolerance_plan_daily_feedback', {
        plan_id: parseInt(req.params.id),
        phase_id: parseInt(phaseId),
        feedback_date: feedbackDate,
        used: used ? 1 : 0,
        actual_drops: actualDrops ? Number(actualDrops) : null,
        skin_condition: skinCondition || null,
        reactions: JSON.stringify(reactions),
        sensitivity: sensitivity ? Number(sensitivity) : null,
        comfort: comfort ? Number(comfort) : null,
        absorption: absorption ? Number(absorption) : null,
        notes: notes || null
      });
    }

    const feedback = queryOne('SELECT * FROM tolerance_plan_daily_feedback WHERE id = ?', [feedbackId]);
    const parsedFeedback = parseDailyFeedback(feedback);
    
    const pauseConditions = checkForPauseConditions({
      sensitivity: parsedFeedback.sensitivity,
      comfort: parsedFeedback.comfort,
      reactions: parsedFeedback.reactions
    });

    const progress = calculatePlanProgress(Number(req.params.id));
    update('tolerance_plans', { progress_percent: progress }, 'id = ?', [req.params.id]);

    res.json({ 
      success: true, 
      data: parsedFeedback,
      pauseWarnings: pauseConditions,
      progressPercent: progress
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/phase/:phaseId/evaluate', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const phaseId = Number(req.params.phaseId);

    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [planId]);
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const evaluation = evaluatePhaseCompletion(planId, phaseId);
    if (!evaluation) {
      return res.status(404).json({ success: false, error: '阶段不存在' });
    }

    res.json({ success: true, data: evaluation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/phase/:phaseId/proceed', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const phaseId = Number(req.params.phaseId);
    const { extendDays, extendReason } = req.body;

    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [planId]);
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const currentPhase = queryOne('SELECT * FROM tolerance_plan_phases WHERE id = ? AND plan_id = ?', [phaseId, planId]);
    if (!currentPhase) {
      return res.status(404).json({ success: false, error: '阶段不存在' });
    }

    const result = transaction(() => {
      if (extendDays && extendDays > 0) {
        const newEndDate = new Date(currentPhase.end_date);
        newEndDate.setDate(newEndDate.getDate() + extendDays);
        
        update('tolerance_plan_phases', {
          extension_days: (currentPhase.extension_days || 0) + extendDays,
          extension_reason: extendReason || null,
          end_date: newEndDate.toISOString().split('T')[0],
          duration_days: currentPhase.duration_days + extendDays,
          status: 'extended',
          updated_at: new Date().toISOString()
        }, 'id = ?', [phaseId]);

        const phase = queryOne('SELECT * FROM tolerance_plan_phases WHERE id = ?', [phaseId]);
        return { extended: true, phase: parseTolerancePhase(phase) };
      } else {
        update('tolerance_plan_phases', {
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, 'id = ?', [phaseId]);

        const nextPhase = queryOne(`
          SELECT * FROM tolerance_plan_phases 
          WHERE plan_id = ? AND phase_number > ? 
          ORDER BY phase_number ASC
          LIMIT 1
        `, [planId, currentPhase.phase_number]);

        let newCurrentPhase = currentPhase.phase_number;
        if (nextPhase) {
          update('tolerance_plan_phases', {
            status: 'in_progress',
            updated_at: new Date().toISOString()
          }, 'id = ?', [nextPhase.id]);
          newCurrentPhase = nextPhase.phase_number;
        } else {
          update('tolerance_plans', {
            status: 'completed',
            updated_at: new Date().toISOString()
          }, 'id = ?', [planId]);
        }

        update('tolerance_plans', {
          current_phase: newCurrentPhase,
          updated_at: new Date().toISOString()
        }, 'id = ?', [planId]);

        const progress = calculatePlanProgress(planId);
        update('tolerance_plans', { progress_percent: progress }, 'id = ?', [planId]);

        const updatedPhase = queryOne('SELECT * FROM tolerance_plan_phases WHERE id = ?', [phaseId]);
        return { completed: true, phase: parseTolerancePhase(updatedPhase), nextPhase: nextPhase ? parseTolerancePhase(nextPhase) : null };
      }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/interrupt', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const { phaseId, interruptionDate, reason, severity, symptoms = [], resumeNotes } = req.body;

    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [planId]);
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    if (!interruptionDate || !reason || !severity) {
      return res.status(400).json({ success: false, error: '请填写必填字段' });
    }

    if (!['mild', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({ success: false, error: '无效的严重程度' });
    }

    const interruptionId = insert('tolerance_plan_interruptions', {
      plan_id: planId,
      phase_id: phaseId ? Number(phaseId) : null,
      interruption_date: interruptionDate,
      reason,
      severity,
      symptoms: JSON.stringify(symptoms),
      resume_notes: resumeNotes || null
    });

    const newStatus = severity === 'severe' ? 'failed' : 'interrupted';
    update('tolerance_plans', {
      status: newStatus,
      updated_at: new Date().toISOString()
    }, 'id = ?', [planId]);

    if (phaseId) {
      update('tolerance_plan_phases', {
        status: 'interrupted',
        updated_at: new Date().toISOString()
      }, 'id = ?', [phaseId]);
    }

    const interruption = queryOne('SELECT * FROM tolerance_plan_interruptions WHERE id = ?', [interruptionId]);
    res.json({ success: true, data: parseInterruption(interruption) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/resume', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const { interruptionId, resumeDate, resumeNotes } = req.body;

    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [planId]);
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    if (!interruptionId || !resumeDate) {
      return res.status(400).json({ success: false, error: '请提供中断记录ID和恢复日期' });
    }

    const interruption = queryOne('SELECT * FROM tolerance_plan_interruptions WHERE id = ? AND plan_id = ?', [interruptionId, planId]);
    if (!interruption) {
      return res.status(404).json({ success: false, error: '中断记录不存在' });
    }

    update('tolerance_plan_interruptions', {
      resumed_at: resumeDate,
      resume_notes: resumeNotes || null
    }, 'id = ?', [interruptionId]);

    update('tolerance_plans', {
      status: 'active',
      updated_at: new Date().toISOString()
    }, 'id = ?', [planId]);

    if (interruption.phase_id) {
      update('tolerance_plan_phases', {
        status: 'in_progress',
        updated_at: new Date().toISOString()
      }, 'id = ?', [interruption.phase_id]);
    }

    const updatedInterruption = queryOne('SELECT * FROM tolerance_plan_interruptions WHERE id = ?', [interruptionId]);
    res.json({ success: true, data: parseInterruption(updatedInterruption) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/evaluate', (req, res) => {
  try {
    const planId = Number(req.params.id);

    const plan = queryOne('SELECT * FROM tolerance_plans WHERE id = ?', [planId]);
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    const result = evaluateFinalResult(planId);

    if (result) {
      update('tolerance_plans', {
        adaptation_conclusion: result.conclusion,
        recommendation: result.recommendation,
        updated_at: new Date().toISOString()
      }, 'id = ?', [planId]);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats/summary', (req, res) => {
  try {
    const stats = queryOne(`
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

    const today = new Date().toISOString().split('T')[0];
    const todayFeedbacks = queryOne(`
      SELECT COUNT(*) as today_feedback_count
      FROM tolerance_plan_daily_feedback
      WHERE feedback_date = ?
    `, [today]);

    res.json({ 
      success: true, 
      data: {
        totalPlans: stats.total_plans || 0,
        activePlans: stats.active_plans || 0,
        completedPlans: stats.completed_plans || 0,
        interruptedPlans: stats.interrupted_plans || 0,
        pausedPlans: stats.paused_plans || 0,
        failedPlans: stats.failed_plans || 0,
        avgProgress: Math.round(stats.avg_progress || 0),
        todayFeedbackCount: todayFeedbacks.today_feedback_count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
