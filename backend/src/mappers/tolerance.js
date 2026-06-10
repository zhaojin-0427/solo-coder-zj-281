function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, (g) => `_${g[0].toLowerCase()}`);
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

function serializeJSONField(value) {
  if (value === undefined || value === null) return '[]';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function convertKeysToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = obj[key];
  }
  return result;
}

function convertKeysToSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = obj[key];
  }
  return result;
}

function toPlanDTO(dbPlan) {
  if (!dbPlan) return null;
  const camelPlan = convertKeysToCamelCase(dbPlan);
  return {
    ...camelPlan,
    observationIndicators: parseJSONField(dbPlan.observation_indicators),
    phaseGoals: parseJSONField(dbPlan.phase_goals),
    totalPhases: dbPlan.total_phases !== undefined ? dbPlan.total_phases : camelPlan.totalPhases,
    completedPhases: dbPlan.completed_phases !== undefined ? dbPlan.completed_phases : camelPlan.completedPhases
  };
}

function toPhaseDTO(dbPhase) {
  if (!dbPhase) return null;
  const camelPhase = convertKeysToSnakeCase(dbPhase);
  return {
    ...convertKeysToCamelCase(dbPhase),
    goals: parseJSONField(dbPhase.goals),
    pauseConditions: parseJSONField(dbPhase.pause_conditions),
    extendedDays: dbPhase.extension_days
  };
}

function toFeedbackDTO(dbFeedback) {
  if (!dbFeedback) return null;
  return {
    ...convertKeysToCamelCase(dbFeedback),
    reactions: parseJSONField(dbFeedback.reactions)
  };
}

function toInterruptionDTO(dbInterruption) {
  if (!dbInterruption) return null;
  return {
    ...convertKeysToCamelCase(dbInterruption),
    symptoms: parseJSONField(dbInterruption.symptoms)
  };
}

function toPlanDB(dto) {
  if (!dto) return null;
  const dbData = convertKeysToSnakeCase(dto);
  if (dto.observationIndicators !== undefined) {
    dbData.observation_indicators = serializeJSONField(dto.observationIndicators);
  }
  if (dto.phaseGoals !== undefined) {
    dbData.phase_goals = serializeJSONField(dto.phaseGoals);
  }
  return dbData;
}

function toPhaseDB(dto) {
  if (!dto) return null;
  const dbData = convertKeysToSnakeCase(dto);
  if (dto.goals !== undefined) {
    dbData.goals = serializeJSONField(dto.goals);
  }
  if (dto.pauseConditions !== undefined) {
    dbData.pause_conditions = serializeJSONField(dto.pauseConditions);
  }
  if (dto.extendedDays !== undefined) {
    dbData.extension_days = dto.extendedDays;
  }
  return dbData;
}

function toFeedbackDB(dto) {
  if (!dto) return null;
  const dbData = convertKeysToSnakeCase(dto);
  if (dto.reactions !== undefined) {
    dbData.reactions = serializeJSONField(dto.reactions);
  }
  if (dto.used !== undefined && typeof dto.used === 'boolean') {
    dbData.used = dto.used ? 1 : 0;
  }
  return dbData;
}

function toInterruptionDB(dto) {
  if (!dto) return null;
  const dbData = convertKeysToSnakeCase(dto);
  if (dto.symptoms !== undefined) {
    dbData.symptoms = serializeJSONField(dto.symptoms);
  }
  return dbData;
}

function toPlanDetailDTO(dbPlan, dbPhases, dbFeedbacks, dbInterruptions, currentPhase, progressPercent) {
  if (!dbPlan) return null;
  const planDTO = toPlanDTO(dbPlan);
  return {
    ...planDTO,
    phases: dbPhases ? dbPhases.map(toPhaseDTO) : [],
    feedbacks: dbFeedbacks ? dbFeedbacks.map(toFeedbackDTO) : [],
    interruptions: dbInterruptions ? dbInterruptions.map(toInterruptionDTO) : [],
    currentPhase: currentPhase ? toPhaseDTO(currentPhase) : null,
    progressPercent: progressPercent
  };
}

function toStatsSummaryDTO(dbStats, todayFeedbackCount) {
  if (!dbStats) return null;
  return {
    totalPlans: dbStats.total_plans || 0,
    activePlans: dbStats.active_plans || 0,
    completedPlans: dbStats.completed_plans || 0,
    interruptedPlans: dbStats.interrupted_plans || 0,
    pausedPlans: dbStats.paused_plans || 0,
    failedPlans: dbStats.failed_plans || 0,
    avgProgress: Math.round(dbStats.avg_progress || 0),
    todayFeedbackCount: todayFeedbackCount || 0
  };
}

export {
  toCamelCase,
  toSnakeCase,
  parseJSONField,
  serializeJSONField,
  convertKeysToCamelCase,
  convertKeysToSnakeCase,
  toPlanDTO,
  toPhaseDTO,
  toFeedbackDTO,
  toInterruptionDTO,
  toPlanDB,
  toPhaseDB,
  toFeedbackDB,
  toInterruptionDB,
  toPlanDetailDTO,
  toStatsSummaryDTO
};
