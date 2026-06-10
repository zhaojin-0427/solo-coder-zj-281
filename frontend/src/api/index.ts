import { get, post, put, del } from './client';
import type {
  Ingredient,
  IngredientType,
  Formula,
  FormulaCreateInput,
  FormulaUpdateInput,
  FormulaAnalysis,
  FormulaIngredientInput,
  UsageRecord,
  UsageRecordCreateInput,
  SkinProfile,
  TrendData,
  RepurchaseRate,
  IngredientFitnessRank,
  SkinCurveData,
  OilTrendData,
  FormulaReviewSummary,
  FormulaRiskWarning,
  FormulaRankItem,
  Candle,
  SubscriptionPlan,
  SubscriptionPlanCreateInput,
  SubscriptionPlanUpdateInput,
  SubscriptionWithDeliveries,
  DeliveryPlan,
  DeliveryInfo,
  SubscriptionStatus,
  Schedule,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  ScheduleCompletion,
  ScheduleCompletionInput,
  TodayReminders,
  RiskWarningsResponse,
  CalendarDay,
  ScheduleSourceType,
  TolerancePlan,
  TolerancePlanCreateInput,
  TolerancePlanUpdateInput,
  TolerancePlanConfigPreview,
  ToleranceDailyFeedback,
  ToleranceDailyFeedbackInput,
  ToleranceDailyFeedbackResponse,
  ToleranceInterruption,
  ToleranceInterruptionInput,
  ToleranceResumeInput,
  PhaseEvaluation,
  PhaseProceedInput,
  FinalEvaluationResult,
  ToleranceStatsSummary,
  ToleranceSourceType,
  TolerancePlanStatus,
  TolerancePlanPhase,
} from '../types';

export const ingredients = {
  getList: (type?: IngredientType) => {
    const params = type ? { type } : undefined;
    return get<Ingredient[]>('/api/ingredients', { params });
  },

  getDetail: (id: number) => {
    return get<Ingredient>(`/api/ingredients/${id}`);
  },
};

export const formulas = {
  getList: () => {
    return get<Formula[]>('/api/formulas');
  },

  getDetail: (id: number) => {
    return get<Formula>(`/api/formulas/${id}`);
  },

  create: (data: FormulaCreateInput) => {
    return post<Formula>('/api/formulas', data);
  },

  update: (id: number, data: FormulaUpdateInput) => {
    return put<Formula>(`/api/formulas/${id}`, data);
  },

  remove: (id: number) => {
    return del<{ message: string }>(`/api/formulas/${id}`);
  },

  analyze: (baseOils: FormulaIngredientInput[] = [], essentialOils: FormulaIngredientInput[] = []) => {
    return post<FormulaAnalysis>('/api/formulas/analyze', { baseOils, essentialOils });
  },

  getReview: (id: number) => {
    return get<FormulaReviewSummary>(`/api/formulas/${id}/review`);
  },

  checkRisks: (baseOils: FormulaIngredientInput[] = [], essentialOils: FormulaIngredientInput[] = []) => {
    return post<FormulaRiskWarning[]>('/api/formulas/check-risks', { baseOils, essentialOils });
  },
};

export const records = {
  getList: () => {
    return get<UsageRecord[]>('/api/records');
  },

  getDetail: (id: number) => {
    return get<UsageRecord>(`/api/records/${id}`);
  },

  create: (data: UsageRecordCreateInput) => {
    return post<UsageRecord>('/api/records', data);
  },
};

export const analysis = {
  getProfile: () => {
    return get<SkinProfile>('/api/analysis/profile');
  },

  getTrend: () => {
    return get<TrendData>('/api/analysis/trend');
  },
};

export const statistics = {
  getRepurchase: () => {
    return get<RepurchaseRate[]>('/api/statistics/repurchase');
  },

  getFitness: (type?: IngredientType) => {
    const params = type ? { type } : undefined;
    return get<IngredientFitnessRank[]>('/api/statistics/fitness', { params });
  },

  getSkinCurve: () => {
    return get<SkinCurveData>('/api/statistics/skin-curve');
  },

  getTrend: () => {
    return get<OilTrendData>('/api/statistics/trend');
  },

  getFormulaReviewRank: () => {
    return get<{
      best: FormulaRankItem[];
      risky: FormulaRankItem[];
    }>('/api/statistics/formula-review-rank');
  },
};

export const candles = {
  getList: () => {
    return get<Candle[]>('/api/subscriptions/candles');
  },

  getDetail: (id: number) => {
    return get<Candle>(`/api/subscriptions/candles/${id}`);
  },
};

export const subscriptions = {
  getList: (status?: SubscriptionStatus) => {
    const params = status ? { status } : undefined;
    return get<SubscriptionPlan[]>('/api/subscriptions', { params });
  },

  getDetail: (id: number) => {
    return get<SubscriptionWithDeliveries>(`/api/subscriptions/${id}`);
  },

  create: (data: SubscriptionPlanCreateInput) => {
    return post<SubscriptionPlan>('/api/subscriptions', data);
  },

  update: (id: number, data: SubscriptionPlanUpdateInput) => {
    return put<SubscriptionPlan>(`/api/subscriptions/${id}`, data);
  },

  pause: (id: number) => {
    return put<SubscriptionPlan>(`/api/subscriptions/${id}/pause`);
  },

  resume: (id: number) => {
    return put<SubscriptionPlan>(`/api/subscriptions/${id}/resume`);
  },

  cancel: (id: number) => {
    return put<SubscriptionPlan>(`/api/subscriptions/${id}/cancel`);
  },

  generatePlan: (id: number) => {
    return get<DeliveryPlan>(`/api/subscriptions/${id}/generate-plan`);
  },

  confirmDelivery: (id: number) => {
    return post<DeliveryInfo>(`/api/subscriptions/${id}/confirm-delivery`);
  },

  getHistory: (id: number) => {
    return get<DeliveryInfo[]>(`/api/subscriptions/${id}/history`);
  },
};

export const schedules = {
  getList: (params?: {
    sourceType?: ScheduleSourceType;
    formulaId?: number;
    subscriptionId?: number;
    status?: string;
  }) => {
    return get<Schedule[]>('/api/schedules', { params });
  },

  getDetail: (id: number) => {
    return get<Schedule>(`/api/schedules/${id}`);
  },

  create: (data: ScheduleCreateInput) => {
    return post<Schedule>('/api/schedules', data);
  },

  update: (id: number, data: ScheduleUpdateInput) => {
    return put<Schedule>(`/api/schedules/${id}`, data);
  },

  remove: (id: number) => {
    return del<{ id: number }>(`/api/schedules/${id}`);
  },

  getTodayReminders: () => {
    return get<TodayReminders>('/api/schedules/today/reminders');
  },

  getRiskWarnings: () => {
    return get<RiskWarningsResponse>('/api/schedules/risks/warnings');
  },

  getCalendar: (params?: {
    startDate?: string;
    endDate?: string;
    sourceType?: ScheduleSourceType;
    formulaId?: number;
    subscriptionId?: number;
  }) => {
    return get<CalendarDay[]>('/api/schedules/calendar/view', { params });
  },

  getNext30Days: (params?: {
    sourceType?: ScheduleSourceType;
    formulaId?: number;
    subscriptionId?: number;
  }) => {
    return get<CalendarDay[]>('/api/schedules/calendar/next30', { params });
  },

  complete: (id: number, data: ScheduleCompletionInput) => {
    return post<ScheduleCompletion>(`/api/schedules/${id}/complete`, data);
  },

  cancelComplete: (id: number, scheduledDate?: string) => {
    const params = scheduledDate ? { scheduledDate } : undefined;
    return del<{ message: string }>(`/api/schedules/${id}/complete`, { params });
  },

  getRange: (params: {
    startDate: string;
    endDate: string;
    sourceType?: ScheduleSourceType;
    formulaId?: number;
    subscriptionId?: number;
  }) => {
    return get<Schedule[]>('/api/schedules/range', { params });
  },
};

export const tolerance = {
  getList: (params?: {
    sourceType?: ToleranceSourceType;
    sourceId?: number;
    status?: TolerancePlanStatus;
  }) => {
    return get<TolerancePlan[]>('/api/tolerance', { params });
  },

  getDetail: (id: number) => {
    return get<TolerancePlan>(`/api/tolerance/${id}`);
  },

  getPreview: (params: {
    sourceType: ToleranceSourceType;
    sourceId: number;
    cycleType?: string;
    customDays?: number;
    startDate?: string;
    initialFrequency?: string;
    initialDrops?: number;
    skinSensitivityLevel?: number;
  }) => {
    return get<TolerancePlanConfigPreview>('/api/tolerance/preview', { params });
  },

  create: (data: TolerancePlanCreateInput) => {
    return post<TolerancePlan>('/api/tolerance', data);
  },

  update: (id: number, data: TolerancePlanUpdateInput) => {
    return put<TolerancePlan>(`/api/tolerance/${id}`, data);
  },

  remove: (id: number) => {
    return del<{ id: number }>(`/api/tolerance/${id}`);
  },

  submitFeedback: (id: number, data: ToleranceDailyFeedbackInput) => {
    return post<ToleranceDailyFeedbackResponse>(`/api/tolerance/${id}/feedback`, data);
  },

  evaluatePhase: (planId: number, phaseId: number) => {
    return post<PhaseEvaluation>(`/api/tolerance/${planId}/phase/${phaseId}/evaluate`);
  },

  proceedPhase: (planId: number, phaseId: number, data: PhaseProceedInput = {}) => {
    return post<{
      extended?: boolean;
      completed?: boolean;
      phase?: TolerancePlanPhase;
      nextPhase?: TolerancePlanPhase | null;
    }>(`/api/tolerance/${planId}/phase/${phaseId}/proceed`, data);
  },

  interrupt: (id: number, data: ToleranceInterruptionInput) => {
    return post<ToleranceInterruption>(`/api/tolerance/${id}/interrupt`, data);
  },

  resume: (id: number, data: ToleranceResumeInput) => {
    return post<ToleranceInterruption>(`/api/tolerance/${id}/resume`, data);
  },

  evaluate: (id: number) => {
    return post<FinalEvaluationResult>(`/api/tolerance/${id}/evaluate`);
  },

  getStats: () => {
    return get<ToleranceStatsSummary>('/api/tolerance/stats/summary');
  },
};

export default {
  ingredients,
  formulas,
  records,
  analysis,
  statistics,
  candles,
  subscriptions,
  schedules,
  tolerance,
};
