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

function parseJSONField(value) {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value;
}

function parseTolerancePlan(plan) {
  if (!plan) return null;
  const parsed = {
    ...plan,
    observationIndicators: parseJSONField(plan.observation_indicators),
    phaseGoals: parseJSONField(plan.phase_goals),
  };
  return addCamelCaseFields(parsed);
}

function parseTolerancePhase(phase) {
  if (!phase) return null;
  const parsed = {
    ...phase,
    goals: parseJSONField(phase.goals),
    pauseConditions: parseJSONField(phase.pause_conditions),
  };
  return addCamelCaseFields(parsed);
}

function parseDailyFeedback(feedback) {
  if (!feedback) return null;
  const parsed = {
    ...feedback,
    reactions: parseJSONField(feedback.reactions),
  };
  return addCamelCaseFields(parsed);
}

function parseInterruption(interruption) {
  if (!interruption) return null;
  const parsed = {
    ...interruption,
    symptoms: parseJSONField(interruption.symptoms),
  };
  return addCamelCaseFields(parsed);
}

function getPhaseDescription(phaseNumber, totalPhases) {
  const descriptions = [
    '适应期：极低剂量起始，观察皮肤基本反应',
    '递增期：逐步增加剂量，确认皮肤耐受性',
    '稳定期：维持目标剂量，评估持续使用效果',
    '巩固期：进一步确认长期使用安全性',
    '完成期：全面评估适配性，给出最终建议'
  ];
  return descriptions[phaseNumber - 1] || `第${phaseNumber}阶段`;
}

function generatePhases(config) {
  const {
    cycleType,
    customDays,
    startDate,
    initialFrequency,
    initialDrops,
    skinSensitivityLevel,
    observationIndicators,
    phaseGoals
  } = config;
  
  const totalDays = cycleType === '7days' ? 7 : cycleType === '14days' ? 14 : (customDays || 21);
  
  const phases = [];
  const start = new Date(startDate);
  
  const sensitivityMultiplier = skinSensitivityLevel >= 3 ? 0.5 : skinSensitivityLevel >= 2 ? 0.75 : 1;
  
  let phaseCount = totalDays <= 7 ? 3 : totalDays <= 14 ? 4 : 5;
  const baseDuration = Math.floor(totalDays / phaseCount);
  const extraDays = totalDays % phaseCount;
  
  const frequencyMap = {
    'every_other_day': '隔日1次',
    'daily': '每日1次',
    'twice_daily': '每日2次',
    'every_two_days': '每2日1次'
  };
  
  const frequencies = [
    'every_two_days',
    'every_other_day',
    'daily',
    'daily',
    'twice_daily'
  ];
  
  let currentDate = new Date(start);
  
  for (let i = 0; i < phaseCount; i++) {
    const duration = baseDuration + (i < extraDays ? 1 : 0);
    const phaseStart = new Date(currentDate);
    const phaseEnd = new Date(currentDate);
    phaseEnd.setDate(phaseEnd.getDate() + duration - 1);
    
    const dropsMultiplier = 1 + (i * 0.5);
    const targetDrops = Math.max(1, Math.round(initialDrops * dropsMultiplier * sensitivityMultiplier));
    const frequencyIndex = Math.min(i, frequencies.length - 1);
    
    const pauseConditions = [
      '出现明显刺痛、灼热感超过5分钟',
      '出现红疹、瘙痒等过敏症状',
      '皮肤敏感度评分 >= 4',
      '舒适度评分 <= 2'
    ];
    
    const defaultGoals = [
      `适应 ${targetDrops} 滴剂量`,
      `使用频率: ${frequencyMap[frequencies[frequencyIndex]]}`,
      '无明显不适反应',
      '皮肤状态稳定'
    ];
    
    phases.push({
      phaseNumber: i + 1,
      name: `第${i + 1}阶段`,
      description: getPhaseDescription(i + 1, phaseCount),
      startDate: phaseStart.toISOString().split('T')[0],
      endDate: phaseEnd.toISOString().split('T')[0],
      durationDays: duration,
      frequency: frequencies[frequencyIndex],
      drops: targetDrops,
      goals: phaseGoals && phaseGoals[i] ? [phaseGoals[i], ...defaultGoals.slice(1)] : defaultGoals,
      status: 'pending',
      pauseConditions: observationIndicators && observationIndicators.length > 0 
        ? [...observationIndicators, ...pauseConditions.slice(2)]
        : pauseConditions
    });
    
    currentDate.setDate(currentDate.getDate() + duration);
  }
  
  return phases;
}

function generateRecommendations(sensitivityLevel, riskWarnings, historicalData) {
  const recommendations = [];
  
  if (sensitivityLevel >= 3) {
    recommendations.push('您的皮肤敏感度较高，建议从极低剂量开始，延长观察期');
  } else if (sensitivityLevel >= 2) {
    recommendations.push('您的皮肤有一定敏感度，建议循序渐进增加剂量');
  }
  
  if (riskWarnings.some(w => w.level === 'danger')) {
    recommendations.push('产品风险较高，首次使用建议在耳后或手臂内侧做皮试');
  }
  
  const recentReactions = historicalData.filter(r => {
    const reactions = parseJSONField(r.reactions);
    return reactions.length > 0;
  }).length;
  
  if (recentReactions > 0) {
    recommendations.push(`您历史上有 ${recentReactions} 次不良反应记录，需特别注意观察`);
  }
  
  recommendations.push('每次使用后请及时记录皮肤反应，便于评估适配性');
  
  return recommendations;
}

function getPhaseRecommendation(canProceed, needsExtension, shouldSuspend) {
  if (shouldSuspend) {
    return {
      action: 'suspend',
      message: '出现严重不良反应，建议暂停使用并咨询专业人士',
      severity: 'danger'
    };
  }
  if (needsExtension) {
    return {
      action: 'extend',
      message: '阶段指标未达标，建议延长当前阶段3-7天',
      severity: 'warning'
    };
  }
  if (canProceed) {
    return {
      action: 'proceed',
      message: '阶段评估通过，可以进入下一阶段',
      severity: 'success'
    };
  }
  return {
    action: 'observe',
    message: '继续观察，收集更多数据',
    severity: 'info'
  };
}

function checkForPauseConditions(feedback) {
  const conditions = [];
  
  if (feedback.sensitivity && feedback.sensitivity >= 4) {
    conditions.push({
      type: 'high_sensitivity',
      message: '敏感度评分过高，建议暂停观察',
      severity: 'warning'
    });
  }
  
  if (feedback.comfort && feedback.comfort <= 2) {
    conditions.push({
      type: 'low_comfort',
      message: '舒适度评分过低，建议暂停观察',
      severity: 'warning'
    });
  }
  
  const reactions = parseJSONField(feedback.reactions);
  const concerningReactions = reactions.filter(r => {
    if (typeof r === 'string') {
      return r.includes('刺痛') || r.includes('痒') || r.includes('红') || r.includes('过敏') || r.includes('肿');
    }
    return r.severity >= 3;
  });
  
  if (concerningReactions.length > 0) {
    conditions.push({
      type: 'adverse_reaction',
      message: '出现不良反应：' + concerningReactions.join(', '),
      severity: 'danger'
    });
  }
  
  return conditions;
}

function generatePlanConfig(sourceType, sourceId, sourceInfo, skinSensitivityLevel, historicalData, riskWarnings, userConfig = {}) {
  const hasSensitivityHistory = historicalData.some(r => r.sensitivity >= 3);
  const hasReactionHistory = historicalData.some(r => {
    const reactions = parseJSONField(r.reactions);
    return reactions.length > 0;
  });
  
  const adjustedSensitivity = Math.max(
    skinSensitivityLevel,
    hasSensitivityHistory ? 2 : 1,
    hasReactionHistory ? 2 : 1
  );
  
  const highRisk = riskWarnings.some(w => w.level === 'danger');
  const mediumRisk = riskWarnings.some(w => w.level === 'warning');
  
  const defaultCycle = highRisk ? '14days' : mediumRisk ? '7days' : '7days';
  const defaultDrops = highRisk ? 1 : mediumRisk ? 2 : 3;
  const defaultFrequency = highRisk ? 'every_two_days' : 'every_other_day';
  
  const startDate = userConfig.startDate || new Date().toISOString().split('T')[0];
  const cycleType = userConfig.cycleType || defaultCycle;
  const totalDays = cycleType === '7days' ? 7 : cycleType === '14days' ? 14 : (userConfig.customDays || 21);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays - 1);
  
  const phases = generatePhases({
    cycleType,
    customDays: userConfig.customDays,
    startDate,
    initialFrequency: userConfig.initialFrequency || defaultFrequency,
    initialDrops: userConfig.initialDrops || defaultDrops,
    skinSensitivityLevel: userConfig.skinSensitivityLevel || adjustedSensitivity,
    observationIndicators: userConfig.observationIndicators,
    phaseGoals: userConfig.phaseGoals
  });
  
  const sourceName = sourceInfo ? sourceInfo.name : '';
  
  return {
    name: userConfig.name || `${sourceName}耐受建立计划`,
    sourceType,
    sourceId,
    sourceName,
    cycleType,
    customDays: userConfig.customDays || null,
    totalDays,
    startDate,
    endDate: endDate.toISOString().split('T')[0],
    initialFrequency: userConfig.initialFrequency || defaultFrequency,
    initialDrops: userConfig.initialDrops || defaultDrops,
    observationIndicators: userConfig.observationIndicators || [],
    phaseGoals: userConfig.phaseGoals || [],
    skinSensitivityLevel: userConfig.skinSensitivityLevel || adjustedSensitivity,
    status: 'active',
    currentPhase: 1,
    progressPercent: 0,
    notes: userConfig.notes || null,
    phases,
    riskWarnings,
    insights: {
      skinSensitivityLevel: adjustedSensitivity,
      hasSensitivityHistory,
      hasReactionHistory,
      riskLevel: highRisk ? 'high' : mediumRisk ? 'medium' : 'low',
      recommendations: generateRecommendations(adjustedSensitivity, riskWarnings, historicalData)
    }
  };
}

function evaluatePhaseCompletion(phase, feedbacks, interruptions) {
  const totalExpectedDays = phase.duration_days || phase.durationDays;
  const actualUsedDays = feedbacks.length;
  const completionRate = (actualUsedDays / totalExpectedDays) * 100;
  
  const avgSensitivity = feedbacks.length > 0 
    ? feedbacks.reduce((sum, f) => sum + (f.sensitivity || 0), 0) / feedbacks.length 
    : 0;
  
  const avgComfort = feedbacks.length > 0 
    ? feedbacks.reduce((sum, f) => sum + (f.comfort || 0), 0) / feedbacks.length 
    : 0;
  
  const hasAdverseReactions = feedbacks.some(f => {
    const reactions = parseJSONField(f.reactions);
    return reactions.some(r => {
      if (typeof r === 'string') {
        return r.includes('刺痛') || r.includes('痒') || r.includes('红') || r.includes('过敏');
      }
      return r.severity >= 3;
    });
  });
  
  const canProceed = completionRate >= 80 
    && avgSensitivity <= 2.5 
    && avgComfort >= 3 
    && !hasAdverseReactions
    && interruptions.length === 0;
  
  const needsExtension = completionRate < 80 
    || avgSensitivity > 2.5 
    || avgComfort < 3 
    || hasAdverseReactions;
  
  const shouldSuspend = interruptions.length > 0 
    || (hasAdverseReactions && avgSensitivity >= 4);
  
  return {
    phaseId: phase.id,
    completionRate,
    actualUsedDays,
    totalExpectedDays,
    avgSensitivity,
    avgComfort,
    hasAdverseReactions,
    interruptionCount: interruptions.length,
    canProceed,
    needsExtension,
    shouldSuspend,
    recommendation: getPhaseRecommendation(canProceed, needsExtension, shouldSuspend),
    feedbacks: feedbacks.map(parseDailyFeedback)
  };
}

function evaluateFinalResult(plan, phases, allFeedbacks, interruptions) {
  const totalDays = plan.total_days || plan.totalDays;
  const actualUsedDays = allFeedbacks.length;
  const completionRate = (actualUsedDays / totalDays) * 100;
  
  const avgSensitivity = allFeedbacks.length > 0 
    ? allFeedbacks.reduce((sum, f) => sum + (f.sensitivity || 0), 0) / allFeedbacks.length 
    : 0;
  
  const avgComfort = allFeedbacks.length > 0 
    ? allFeedbacks.reduce((sum, f) => sum + (f.comfort || 0), 0) / allFeedbacks.length 
    : 0;
  
  const avgAbsorption = allFeedbacks.length > 0 
    ? allFeedbacks.reduce((sum, f) => sum + (f.absorption || 0), 0) / allFeedbacks.length 
    : 0;
  
  const severeInterruptions = interruptions.filter(i => i.severity === 'severe').length;
  const moderateInterruptions = interruptions.filter(i => i.severity === 'moderate').length;
  
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const phaseCompletionRate = phases.length > 0 ? (completedPhases / phases.length) * 100 : 0;
  
  let adaptationLevel = 'not_adapted';
  let conclusion = '';
  let recommendation = '';
  
  if (severeInterruptions > 0) {
    adaptationLevel = 'not_adapted';
    conclusion = '使用过程中出现严重不良反应，不建议继续使用';
    recommendation = '建议停止使用该产品，咨询皮肤科医生或芳疗师，选择更温和的替代方案';
  } else if (avgSensitivity >= 4 || avgComfort <= 2) {
    adaptationLevel = 'poorly_adapted';
    conclusion = '皮肤耐受性较差，持续存在不适反应';
    recommendation = '建议降低使用频率和剂量，或更换为更温和的配方；如症状持续请咨询专业人士';
  } else if (completionRate >= 80 && phaseCompletionRate >= 75 && avgSensitivity <= 2.5 && avgComfort >= 3.5) {
    adaptationLevel = 'well_adapted';
    conclusion = '皮肤对产品适应性良好，可以安全使用';
    recommendation = '可以按照推荐剂量和频率正常使用，建议定期观察皮肤状态变化';
  } else if (completionRate >= 60 && avgSensitivity <= 3 && avgComfort >= 3) {
    adaptationLevel = 'moderately_adapted';
    conclusion = '皮肤基本适应，但仍需注意观察';
    recommendation = '可以继续使用，但建议维持较低剂量，密切关注皮肤反应，逐步增加使用频率';
  } else {
    adaptationLevel = 'needs_more_data';
    conclusion = '数据不足，无法准确评估适配性';
    recommendation = '建议继续收集使用数据，或重新进行一个周期的耐受建立';
  }
  
  const scores = {
    completionRate: Math.round(completionRate),
    sensitivityScore: Math.round(((5 - avgSensitivity) / 4) * 100),
    comfortScore: Math.round(((avgComfort - 1) / 4) * 100),
    absorptionScore: Math.round(((avgAbsorption - 1) / 4) * 100),
    safetyScore: Math.round(Math.max(0, 100 - severeInterruptions * 50 - moderateInterruptions * 25))
  };
  
  scores.overallScore = Math.round(
    (scores.completionRate * 0.2 + 
     scores.sensitivityScore * 0.3 + 
     scores.comfortScore * 0.25 + 
     scores.absorptionScore * 0.1 + 
     scores.safetyScore * 0.15)
  );
  
  const lastPhase = phases[phases.length - 1];
  const maxToleratedDrops = lastPhase ? lastPhase.drops : (plan.initial_drops || plan.initialDrops || 3);
  
  const recommendedFrequency = (() => {
    if (avgSensitivity >= 3) return 'every_other_day';
    if (avgSensitivity >= 2) return 'daily';
    if (avgComfort >= 4) return 'twice_daily';
    return 'daily';
  })();
  
  const summary = `经过${totalDays}天的耐受建立，共实际使用${actualUsedDays}天，完成率${Math.round(completionRate)}%。${conclusion}`;
  
  const suggestions = [
    `最大耐受剂量：${maxToleratedDrops}滴`,
    `推荐使用频率：${({
      'every_two_days': '每2日1次',
      'every_other_day': '隔日1次',
      'daily': '每日1次',
      'twice_daily': '每日2次'
    })[recommendedFrequency]}`,
    avgSensitivity >= 3 ? '皮肤偏敏感，建议持续低剂量使用' : '皮肤状态稳定，可正常使用',
    severeInterruptions > 0 ? '曾出现严重反应，后续使用需特别谨慎' : moderateInterruptions > 0 ? '曾出现中度反应，建议逐步增加剂量' : '无严重不良反应记录',
    '建议每月进行一次皮肤状态评估',
    '如出现持续不适请及时停止使用并咨询专业人士'
  ].filter(Boolean);
  
  return {
    planId: plan.id,
    adaptationLevel,
    conclusion,
    recommendation,
    maxToleratedDrops,
    recommendedFrequency,
    summary,
    suggestions,
    scores,
    stats: {
      totalDays,
      actualUsedDays,
      completionRate: Math.round(completionRate),
      phaseCompletionRate: Math.round(phaseCompletionRate),
      avgSensitivity: Number(avgSensitivity.toFixed(1)),
      avgComfort: Number(avgComfort.toFixed(1)),
      avgAbsorption: Number(avgAbsorption.toFixed(1)),
      severeInterruptions,
      moderateInterruptions,
      mildInterruptions: interruptions.filter(i => i.severity === 'mild').length
    },
    phases: phases.map(parseTolerancePhase),
    feedbacks: allFeedbacks.map(parseDailyFeedback),
    interruptions: interruptions.map(parseInterruption)
  };
}

function calculatePlanProgress(plan, phases, countFeedbacksByPhaseId) {
  if (!plan) return 0;
  
  const totalPhases = phases.length;
  if (totalPhases === 0) return 0;
  
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const inProgressPhase = phases.find(p => p.status === 'in_progress');
  
  let progress = 0;
  
  if (inProgressPhase) {
    const usedDays = countFeedbacksByPhaseId(inProgressPhase.id);
    const phaseProgress = Math.min(1, usedDays / inProgressPhase.duration_days);
    progress = (completedPhases + phaseProgress) / totalPhases;
  } else {
    progress = completedPhases / totalPhases;
  }
  
  return Math.round(progress * 100);
}

function getCurrentPhase(phases) {
  const inProgress = phases.find(p => p.status === 'in_progress');
  if (inProgress) return inProgress;
  
  const pending = phases.find(p => p.status === 'pending');
  if (pending) return pending;
  
  const lastCompleted = phases.filter(p => p.status === 'completed').pop();
  return lastCompleted || null;
}

export {
  toCamelCase,
  addCamelCaseFields,
  parseJSONField,
  parseTolerancePlan,
  parseTolerancePhase,
  parseDailyFeedback,
  parseInterruption,
  generatePhases,
  generatePlanConfig,
  evaluatePhaseCompletion,
  evaluateFinalResult,
  calculatePlanProgress,
  getCurrentPhase,
  checkForPauseConditions,
  getPhaseRecommendation,
  generateRecommendations,
  getPhaseDescription
};
