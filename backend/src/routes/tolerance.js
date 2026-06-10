import express from 'express';
import * as toleranceService from '../services/tolerance.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { sourceType, sourceId, status } = req.query;
    const plans = toleranceService.getPlanList({ sourceType, sourceId, status });
    res.json({ success: true, data: plans });
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

    const config = toleranceService.generatePlanConfig(sourceType, Number(sourceId), {
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
    const plan = toleranceService.getPlanDetail(Number(req.params.id));
    
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    res.json({ success: true, data: plan });
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
      observationIndicators,
      phaseGoals,
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

    const plan = toleranceService.createPlan({
      sourceType,
      sourceId: Number(sourceId),
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

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, notes, status } = req.body;

    if (status !== undefined) {
      if (!['active', 'paused', 'completed', 'interrupted', 'failed'].includes(status)) {
        return res.status(400).json({ success: false, error: '无效的状态' });
      }
    }

    const plan = toleranceService.updatePlan(Number(req.params.id), { name, notes, status });
    
    if (!plan) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = toleranceService.deletePlan(Number(req.params.id));
    
    if (!result) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/feedback', (req, res) => {
  try {
    const { phaseId, feedbackDate, used, actualDrops, skinCondition, reactions, sensitivity, comfort, absorption, notes } = req.body;

    if (!phaseId || !feedbackDate) {
      return res.status(400).json({ success: false, error: '请提供阶段ID和反馈日期' });
    }

    const result = toleranceService.submitFeedback(Number(req.params.id), {
      phaseId: Number(phaseId),
      feedbackDate,
      used,
      actualDrops: actualDrops ? Number(actualDrops) : undefined,
      skinCondition,
      reactions,
      sensitivity: sensitivity ? Number(sensitivity) : undefined,
      comfort: comfort ? Number(comfort) : undefined,
      absorption: absorption ? Number(absorption) : undefined,
      notes
    });

    if (!result) {
      return res.status(404).json({ success: false, error: '耐受计划或阶段不存在' });
    }

    res.json({ 
      success: true, 
      data: result.data,
      pauseWarnings: result.pauseWarnings,
      progressPercent: result.progressPercent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/phase/:phaseId/evaluate', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const phaseId = Number(req.params.phaseId);

    const evaluation = toleranceService.evaluatePhase(planId, phaseId);
    
    if (!evaluation) {
      return res.status(404).json({ success: false, error: '计划或阶段不存在' });
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

    const result = toleranceService.proceedPhase(planId, phaseId, {
      extendDays: extendDays ? Number(extendDays) : undefined,
      extendReason
    });

    if (!result) {
      return res.status(404).json({ success: false, error: '计划或阶段不存在' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/interrupt', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const { phaseId, interruptionDate, reason, severity, symptoms, resumeNotes } = req.body;

    if (!interruptionDate || !reason || !severity) {
      return res.status(400).json({ success: false, error: '请填写必填字段' });
    }

    if (!['mild', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({ success: false, error: '无效的严重程度' });
    }

    const result = toleranceService.interruptPlan(planId, {
      phaseId: phaseId ? Number(phaseId) : undefined,
      interruptionDate,
      reason,
      severity,
      symptoms: symptoms || [],
      resumeNotes
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/resume', (req, res) => {
  try {
    const planId = Number(req.params.id);
    const { interruptionId, resumeDate, resumeNotes } = req.body;

    if (!interruptionId || !resumeDate) {
      return res.status(400).json({ success: false, error: '请提供中断记录ID和恢复日期' });
    }

    const result = toleranceService.resumePlan(planId, {
      interruptionId: Number(interruptionId),
      resumeDate,
      resumeNotes
    });

    if (!result) {
      return res.status(404).json({ success: false, error: '计划或中断记录不存在' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/evaluate', (req, res) => {
  try {
    const planId = Number(req.params.id);

    const result = toleranceService.evaluatePlan(planId);
    
    if (!result) {
      return res.status(404).json({ success: false, error: '耐受计划不存在' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats/summary', (req, res) => {
  try {
    const stats = toleranceService.getStatsSummary();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
