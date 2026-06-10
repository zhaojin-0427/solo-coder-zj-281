import * as toleranceRepo from '../repositories/tolerance.js';
import * as profileRepo from '../repositories/profile.js';
import * as mapper from '../mappers/tolerance.js';
import * as engine from '../utils/toleranceEngine.js';

function getRiskWarnings(sourceType, sourceId) {
  return sourceType === 'formula'
    ? profileRepo.getFormulaRiskWarnings(sourceId)
    : profileRepo.getIngredientRiskWarnings(sourceId);
}

function generatePlanConfig(sourceType, sourceId, userConfig) {
  const sourceInfo = profileRepo.getSourceInfo(sourceType, sourceId);
  const skinSensitivityLevel = profileRepo.getSkinSensitivityLevel();
  const historicalData = profileRepo.getHistoricalUsageData(sourceType, sourceId);
  const riskWarnings = getRiskWarnings(sourceType, sourceId);

  return engine.generatePlanConfig(
    sourceType,
    sourceId,
    sourceInfo,
    skinSensitivityLevel,
    historicalData,
    riskWarnings,
    userConfig
  );
}

function getPlanList(params) {
  const dbPlans = toleranceRepo.findPlans(params);
  return dbPlans.map(dbPlan => {
    const planDTO = mapper.toPlanDTO(dbPlan);
    planDTO.totalPhases = dbPlan.total_phases || 0;
    planDTO.completedPhases = dbPlan.completed_phases || 0;
    return planDTO;
  });
}

function getPlanDetail(planId) {
  const dbPlan = toleranceRepo.findPlanById(planId);
  if (!dbPlan) return null;

  const dbPhases = toleranceRepo.findPhasesByPlanId(planId);
  const dbFeedbacks = toleranceRepo.findFeedbacksByPlanId(planId);
  const dbInterruptions = toleranceRepo.findInterruptionsByPlanId(planId);
  
  const currentPhaseDB = engine.getCurrentPhase(dbPhases);
  const progress = engine.calculatePlanProgress(
    dbPlan,
    dbPhases,
    (phaseId) => toleranceRepo.countFeedbacksByPhaseId(phaseId)
  );

  return mapper.toPlanDetailDTO(
    dbPlan,
    dbPhases,
    dbFeedbacks,
    dbInterruptions,
    currentPhaseDB,
    progress
  );
}

function createPlan(inputData) {
  const planConfig = generatePlanConfig(
    inputData.sourceType,
    Number(inputData.sourceId),
    inputData
  );

  const planId = toleranceRepo.executeInTransaction(() => {
    const planDB = mapper.toPlanDB({
      name: planConfig.name,
      sourceType: planConfig.sourceType,
      sourceId: planConfig.sourceId,
      sourceName: planConfig.sourceName,
      cycleType: planConfig.cycleType,
      customDays: planConfig.customDays,
      totalDays: planConfig.totalDays,
      startDate: planConfig.startDate,
      endDate: planConfig.endDate,
      initialFrequency: planConfig.initialFrequency,
      initialDrops: planConfig.initialDrops,
      observationIndicators: planConfig.observationIndicators,
      phaseGoals: planConfig.phaseGoals,
      skinSensitivityLevel: planConfig.skinSensitivityLevel,
      status: 'active',
      currentPhase: 1,
      progressPercent: 0,
      notes: planConfig.notes
    });

    const id = toleranceRepo.createPlan(planDB);

    planConfig.phases.forEach(phase => {
      const phaseDB = mapper.toPhaseDB({
        planId: id,
        phaseNumber: phase.phaseNumber,
        name: phase.name,
        description: phase.description,
        startDate: phase.startDate,
        endDate: phase.endDate,
        durationDays: phase.durationDays,
        frequency: phase.frequency,
        drops: phase.drops,
        goals: phase.goals,
        status: phase.phaseNumber === 1 ? 'in_progress' : 'pending',
        pauseConditions: phase.pauseConditions
      });
      toleranceRepo.createPhase(phaseDB);
    });

    return id;
  });

  const dbPlan = toleranceRepo.findPlanById(planId);
  return mapper.toPlanDTO(dbPlan);
}

function updatePlan(planId, updateData) {
  const existing = toleranceRepo.findPlanById(planId);
  if (!existing) return null;

  const updateDB = {};
  if (updateData.name !== undefined) updateDB.name = updateData.name;
  if (updateData.notes !== undefined) updateDB.notes = updateData.notes || null;
  if (updateData.status !== undefined) updateDB.status = updateData.status;
  
  if (Object.keys(updateDB).length === 0) {
    return mapper.toPlanDTO(existing);
  }

  updateDB.updated_at = new Date().toISOString();
  const changes = toleranceRepo.updatePlan(planId, updateDB);
  
  if (changes === 0) return null;

  const updated = toleranceRepo.findPlanById(planId);
  return mapper.toPlanDTO(updated);
}

function deletePlan(planId) {
  const existing = toleranceRepo.findPlanById(planId);
  if (!existing) return null;

  const changes = toleranceRepo.deletePlan(planId);
  return changes > 0 ? { id: planId } : null;
}

function submitFeedback(planId, feedbackData) {
  const plan = toleranceRepo.findPlanById(planId);
  if (!plan) return null;

  const phase = toleranceRepo.findPhaseById(Number(feedbackData.phaseId), planId);
  if (!phase) return null;

  const existingFeedback = toleranceRepo.findFeedbackByUniqueKey(
    planId,
    Number(feedbackData.phaseId),
    feedbackData.feedbackDate
  );

  const feedbackDB = mapper.toFeedbackDB({
    planId,
    phaseId: feedbackData.phaseId,
    feedbackDate: feedbackData.feedbackDate,
    used: feedbackData.used,
    actualDrops: feedbackData.actualDrops,
    skinCondition: feedbackData.skinCondition,
    reactions: feedbackData.reactions,
    sensitivity: feedbackData.sensitivity,
    comfort: feedbackData.comfort,
    absorption: feedbackData.absorption,
    notes: feedbackData.notes
  });

  let feedbackId;
  if (existingFeedback) {
    const changes = toleranceRepo.updateFeedback(existingFeedback.id, feedbackDB);
    if (changes === 0) return null;
    feedbackId = existingFeedback.id;
  } else {
    feedbackId = toleranceRepo.createFeedback(feedbackDB);
  }

  const dbFeedback = toleranceRepo.findFeedbackById(feedbackId);
  const feedbackDTO = mapper.toFeedbackDTO(dbFeedback);

  const pauseConditions = engine.checkForPauseConditions({
    sensitivity: feedbackDTO.sensitivity,
    comfort: feedbackDTO.comfort,
    reactions: feedbackDTO.reactions
  });

  const dbPhases = toleranceRepo.findPhasesByPlanId(planId);
  const progress = engine.calculatePlanProgress(
    plan,
    dbPhases,
    (pid) => toleranceRepo.countFeedbacksByPhaseId(pid)
  );
  toleranceRepo.updatePlan(planId, { progress_percent: progress });

  return {
    data: feedbackDTO,
    pauseWarnings: pauseConditions,
    progressPercent: progress
  };
}

function evaluatePhase(planId, phaseId) {
  const plan = toleranceRepo.findPlanById(planId);
  if (!plan) return null;

  const phase = toleranceRepo.findPhaseById(phaseId, planId);
  if (!phase) return null;

  const feedbacks = toleranceRepo.findFeedbacksByPhaseId(phaseId);
  const interruptions = toleranceRepo.findInterruptionsByPhaseId(phaseId, ['moderate', 'severe']);

  return engine.evaluatePhaseCompletion(phase, feedbacks, interruptions);
}

function proceedPhase(planId, phaseId, proceedData) {
  const plan = toleranceRepo.findPlanById(planId);
  if (!plan) return null;

  const currentPhase = toleranceRepo.findPhaseById(phaseId, planId);
  if (!currentPhase) return null;

  return toleranceRepo.executeInTransaction(() => {
    if (proceedData.extendDays && proceedData.extendDays > 0) {
      const newEndDate = new Date(currentPhase.end_date);
      newEndDate.setDate(newEndDate.getDate() + proceedData.extendDays);
      
      toleranceRepo.updatePhase(phaseId, {
        extension_days: (currentPhase.extension_days || 0) + proceedData.extendDays,
        extension_reason: proceedData.extendReason || null,
        end_date: newEndDate.toISOString().split('T')[0],
        duration_days: currentPhase.duration_days + proceedData.extendDays,
        status: 'extended',
        updated_at: new Date().toISOString()
      });

      const phase = toleranceRepo.findPhaseByIdOnly(phaseId);
      return { extended: true, phase: mapper.toPhaseDTO(phase) };
    } else {
      toleranceRepo.updatePhase(phaseId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const nextPhase = toleranceRepo.findNextPhase(planId, currentPhase.phase_number);

      let newCurrentPhase = currentPhase.phase_number;
      if (nextPhase) {
        toleranceRepo.updatePhase(nextPhase.id, {
          status: 'in_progress',
          updated_at: new Date().toISOString()
        });
        newCurrentPhase = nextPhase.phase_number;
      } else {
        toleranceRepo.updatePlan(planId, {
          status: 'completed',
          updated_at: new Date().toISOString()
        });
      }

      toleranceRepo.updatePlan(planId, {
        current_phase: newCurrentPhase,
        updated_at: new Date().toISOString()
      });

      const dbPhases = toleranceRepo.findPhasesByPlanId(planId);
      const progress = engine.calculatePlanProgress(
        plan,
        dbPhases,
        (pid) => toleranceRepo.countFeedbacksByPhaseId(pid)
      );
      toleranceRepo.updatePlan(planId, { progress_percent: progress });

      const updatedPhase = toleranceRepo.findPhaseByIdOnly(phaseId);
      return {
        completed: true,
        phase: mapper.toPhaseDTO(updatedPhase),
        nextPhase: nextPhase ? mapper.toPhaseDTO(nextPhase) : null
      };
    }
  });
}

function interruptPlan(planId, interruptionData) {
  const plan = toleranceRepo.findPlanById(planId);
  if (!plan) return null;

  const interruptionDB = mapper.toInterruptionDB({
    planId,
    phaseId: interruptionData.phaseId,
    interruptionDate: interruptionData.interruptionDate,
    reason: interruptionData.reason,
    severity: interruptionData.severity,
    symptoms: interruptionData.symptoms || [],
    resumeNotes: interruptionData.resumeNotes
  });

  const interruptionId = toleranceRepo.createInterruption(interruptionDB);

  const newStatus = interruptionData.severity === 'severe' ? 'failed' : 'interrupted';
  toleranceRepo.updatePlan(planId, {
    status: newStatus,
    updated_at: new Date().toISOString()
  });

  if (interruptionData.phaseId) {
    toleranceRepo.updatePhase(Number(interruptionData.phaseId), {
      status: 'interrupted',
      updated_at: new Date().toISOString()
    });
  }

  const dbInterruption = toleranceRepo.findInterruptionByIdOnly(interruptionId);
  return mapper.toInterruptionDTO(dbInterruption);
}

function resumePlan(planId, resumeData) {
  const plan = toleranceRepo.findPlanById(planId);
  if (!plan) return null;

  const interruption = toleranceRepo.findInterruptionById(
    Number(resumeData.interruptionId),
    planId
  );
  if (!interruption) return null;

  toleranceRepo.updateInterruption(Number(resumeData.interruptionId), {
    resumed_at: resumeData.resumeDate,
    resume_notes: resumeData.resumeNotes || null
  });

  toleranceRepo.updatePlan(planId, {
    status: 'active',
    updated_at: new Date().toISOString()
  });

  if (interruption.phase_id) {
    toleranceRepo.updatePhase(interruption.phase_id, {
      status: 'in_progress',
      updated_at: new Date().toISOString()
    });
  }

  const updatedInterruption = toleranceRepo.findInterruptionByIdOnly(Number(resumeData.interruptionId));
  return mapper.toInterruptionDTO(updatedInterruption);
}

function evaluatePlan(planId) {
  const plan = toleranceRepo.findPlanById(planId);
  if (!plan) return null;

  const phases = toleranceRepo.findPhasesByPlanId(planId);
  const allFeedbacks = toleranceRepo.findFeedbacksByPlanId(planId, 1000);
  const interruptions = toleranceRepo.findInterruptionsByPlanId(planId);

  const result = engine.evaluateFinalResult(plan, phases, allFeedbacks, interruptions);

  if (result) {
    toleranceRepo.updatePlan(planId, {
      adaptation_conclusion: result.conclusion,
      recommendation: result.recommendation,
      updated_at: new Date().toISOString()
    });
  }

  return result;
}

function getStatsSummary() {
  const stats = toleranceRepo.getStatsSummary();
  const today = new Date().toISOString().split('T')[0];
  const todayFeedbacks = toleranceRepo.countTodayFeedbacks(today);
  return mapper.toStatsSummaryDTO(stats, todayFeedbacks);
}

export {
  generatePlanConfig,
  getPlanList,
  getPlanDetail,
  createPlan,
  updatePlan,
  deletePlan,
  submitFeedback,
  evaluatePhase,
  proceedPhase,
  interruptPlan,
  resumePlan,
  evaluatePlan,
  getStatsSummary
};
