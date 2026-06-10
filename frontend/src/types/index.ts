export type IngredientType = 'base' | 'essential';

export interface Ingredient {
  id: number;
  name: string;
  english_name: string;
  type: IngredientType;
  description: string | null;
  effects: string[];
  contraindications: string[];
  skin_types: string[];
  aroma: string | null;
  color: string | null;
  viscosity: string | null;
  origin: string | null;
  pairing_suggestions: string[];
  safety_level: number;
  created_at: string;
  updated_at: string;
}

export interface FormulaIngredient {
  id: number;
  ingredient_id: number;
  type: IngredientType;
  drops: number;
  name: string;
  english_name: string;
}

export interface Formula {
  id: number;
  name: string;
  description: string | null;
  purpose: string | null;
  effect_tags: string[];
  contraindications: string[];
  suitable_skin_types: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  ingredients: FormulaIngredient[];
}

export interface FormulaIngredientInput {
  ingredientId: number;
  drops: number;
}

export interface FormulaCreateInput {
  name: string;
  description?: string | null;
  purpose?: string | null;
  notes?: string | null;
  baseOils?: FormulaIngredientInput[];
  essentialOils?: FormulaIngredientInput[];
}

export interface FormulaUpdateInput {
  name?: string;
  description?: string | null;
  purpose?: string | null;
  notes?: string | null;
  baseOils?: FormulaIngredientInput[];
  essentialOils?: FormulaIngredientInput[];
}

export interface FormulaAnalysis {
  effectTags: string[];
  contraindications: string[];
  suitableSkinTypes: string[];
}

export interface Reaction {
  type: string;
  description?: string;
  severity?: number;
}

export interface UsageRecordFormula {
  id: number;
  name: string;
  description: string | null;
}

export interface UsageRecord {
  id: number;
  formula_id: number | null;
  formulaId: number | null;
  date: string;
  usageDate: string;
  skin_condition_before: string | null;
  skin_condition_after: string | null;
  skin_condition: string | null;
  skinCondition: string | null;
  reactions: (string | Reaction)[];
  notes: string | null;
  rating: number | null;
  absorption_rating: number | null;
  sensitivity_rating: number | null;
  improvement_rating: number | null;
  absorption: number | null;
  sensitivity: number | null;
  improvement: number | null;
  created_at: string;
  formula: UsageRecordFormula | null;
}

export interface UsageRecordCreateInput {
  formulaId?: number | null;
  usageDate: string;
  skinConditionBefore?: string | null;
  skinConditionAfter?: string | null;
  skinCondition?: string | null;
  reactions?: (string | Reaction)[];
  notes?: string | null;
  rating?: number | null;
  absorption?: number | null;
  sensitivity?: number | null;
  improvement?: number | null;
}

export interface SkinTypeInfo {
  type: string;
  confidence: number;
  allTypes?: Array<{
    type: string;
    score: number;
    ratio: number;
  }>;
}

export interface SkinConcern {
  concern: string;
  count: number;
}

export interface IngredientFitness {
  id: number;
  name: string;
  englishName: string;
  type: IngredientType;
  useCount: number;
  avgImprovement: number;
  fitnessScore: number;
}

export interface SkinProfile {
  totalRecords: number;
  avgAbsorption: number;
  avgSensitivity: number;
  avgImprovement: number;
  skinType: SkinTypeInfo;
  concerns: SkinConcern[];
  ingredientFitness: IngredientFitness[];
}

export interface TrendDailyRecord {
  id: number;
  formulaId: number | null;
  rating: number | null;
  improvement: number;
}

export interface TrendDailyData {
  date: string;
  count: number;
  avgRating: number;
  avgImprovement: number;
  records: TrendDailyRecord[];
}

export interface TrendData {
  period: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
  dailyData: TrendDailyData[];
}

export interface RepurchaseRate {
  id: number;
  name: string;
  description: string | null;
  useCount: number;
  avgRating: number;
  repurchaseRate: '高' | '中' | '低';
}

export interface IngredientFitnessRank {
  id: number;
  name: string;
  englishName: string;
  type: IngredientType;
  useCount: number;
  avgRating: number;
  fitnessScore: number;
}

export interface SkinCurvePoint {
  date: string;
  recordCount: number;
  avgRating: number;
}

export interface SkinCurveData {
  totalRecords: number;
  avgOverallRating: number;
  curveData: SkinCurvePoint[];
}

export interface WeeklyTopOil {
  id: number;
  name: string;
  englishName: string;
  count: number;
}

export interface WeeklyOilData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalUses: number;
  topOils: WeeklyTopOil[];
}

export interface OilTrendData {
  period: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
  weeklyData: WeeklyOilData[];
  overallTopOils: WeeklyTopOil[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type RecommendationType = 'continue' | 'reduce_drops' | 'replace_ingredient' | 'suspend';

export interface FormulaReviewSummary {
  formulaId: number;
  formulaName: string;
  useCount: number;
  avgAbsorption: number;
  avgSensitivity: number;
  avgImprovement: number;
  lastFeedback: string | null;
  lastFeedbackDate: string | null;
  lastRating: number | null;
  reactionKeywords: string[];
  adaptationConclusion: string;
  recommendation: RecommendationType;
  recommendationReason: string;
  fitnessScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  sensitiveIngredients: Array<{
    id: number;
    name: string;
    sensitivityCount: number;
    avgSensitivity: number;
  }>;
}

export interface FormulaRiskWarning {
  level: 'info' | 'warning' | 'danger';
  type: 'contraindication' | 'sensitivity_history' | 'drops_ratio';
  message: string;
  details?: string;
  relatedIngredients?: Array<{
    id: number;
    name: string;
  }>;
}

export interface FormulaRankItem {
  id: number;
  name: string;
  useCount: number;
  avgAbsorption: number;
  avgSensitivity: number;
  avgImprovement: number;
  fitnessScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: RecommendationType;
  lastUsedDate: string | null;
}

export type AromaFamily = 'floral' | 'citrus' | 'woody' | 'herbal' | 'fresh' | 'gourmand' | 'oriental' | 'spicy';
export type DeliveryCycle = 'weekly' | 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'completed';
export type DeliveryStatus = 'pending' | 'generated' | 'shipped' | 'delivered' | 'cancelled';

export interface Candle {
  id: number;
  name: string;
  englishName: string;
  english_name: string;
  description: string | null;
  scentNotes: string[];
  scent_notes: string[];
  aromaFamily: AromaFamily;
  aroma_family: AromaFamily;
  burnTimeHours: number;
  burn_time_hours: number;
  weightGrams: number;
  weight_grams: number;
  price: number;
  stockQuantity: number;
  stock_quantity: number;
  safetyLevel: number;
  safety_level: number;
  origin: string | null;
  imageUrl: string | null;
  image_url: string | null;
  isActive: number;
  is_active: number;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  restockInfo?: RestockPrediction;
}

export interface RestockPrediction {
  currentStock: number;
  avgDailyDemand: number;
  daysUntilEmpty: number;
  needsRestock: boolean;
  recommendedOrderQuantity: number;
}

export interface SpecialDate {
  date: string;
  type: 'birthday' | 'festival' | 'anniversary';
  note?: string;
}

export interface SubscriptionPlan {
  id: number;
  planName: string;
  plan_name: string;
  recipientName: string;
  recipient_name: string;
  recipientPhone: string | null;
  recipient_phone: string | null;
  recipientAddress: string;
  recipient_address: string;
  deliveryCycle: DeliveryCycle;
  delivery_cycle: DeliveryCycle;
  budgetLimit: number;
  budget_limit: number;
  candlesPerDelivery: number;
  candles_per_delivery: number;
  deliveryScene: string;
  delivery_scene: string;
  preferredAromas: string[];
  preferred_aromas: string[];
  excludedScents: string[];
  excluded_scents: string[];
  specialDates: SpecialDate[];
  special_dates: SpecialDate[];
  status: SubscriptionStatus;
  userNotes: string | null;
  user_notes: string | null;
  startDate: string;
  start_date: string;
  nextDeliveryDate: string | null;
  next_delivery_date: string | null;
  totalDeliveries: number;
  total_deliveries: number;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  deliveries?: DeliveryInfo[];
}

export interface SubscriptionPlanCreateInput {
  planName: string;
  recipientName: string;
  recipientPhone?: string | null;
  recipientAddress: string;
  deliveryCycle: DeliveryCycle;
  budgetLimit: number;
  candlesPerDelivery?: number;
  deliveryScene: string;
  preferredAromas?: string[];
  excludedScents?: string[];
  specialDates?: SpecialDate[];
  userNotes?: string | null;
  startDate: string;
}

export interface SubscriptionPlanUpdateInput {
  planName?: string;
  recipientName?: string;
  recipientPhone?: string | null;
  recipientAddress?: string;
  deliveryCycle?: DeliveryCycle;
  budgetLimit?: number;
  candlesPerDelivery?: number;
  deliveryScene?: string;
  preferredAromas?: string[];
  excludedScents?: string[];
  specialDates?: SpecialDate[];
  userNotes?: string | null;
}

export interface DeliveryInfo {
  id: number;
  subscriptionId: number;
  subscription_id: number;
  deliveryNumber: number;
  delivery_number: number;
  scheduledDate: string;
  scheduled_date: string;
  actualDeliveryDate: string | null;
  actual_delivery_date: string | null;
  status: DeliveryStatus;
  totalPrice: number;
  total_price: number;
  candleCount: number;
  candle_count: number;
  estimatedBurnDays: number;
  estimated_burn_days: number;
  conflictWarnings: ConflictWarning[];
  conflict_warnings: ConflictWarning[];
  outOfStockNotes: string | null;
  out_of_stock_notes: string | null;
  deliveryNotes: string | null;
  delivery_notes: string | null;
  createdAt: string;
  created_at: string;
  candleList?: string[];
  candle_list?: string[];
  contents?: DeliveryContent[];
}

export interface ConflictWarning {
  type: 'aroma_conflict';
  candleA: string;
  candleB: string;
  message: string;
}

export interface DeliveryContent {
  id: number;
  deliveryId: number;
  delivery_id: number;
  candleId: number;
  candle_id: number;
  quantity: number;
  unitPrice: number;
  unit_price: number;
  isReplacement: boolean;
  is_replacement: boolean;
  originalCandleId: number | null;
  original_candle_id: number | null;
  replacementReason: string | null;
  replacement_reason: string | null;
  matchScore: number;
  match_score: number;
  name?: string;
  englishName?: string;
  aromaFamily?: AromaFamily;
  scentNotes?: string[];
}

export interface DeliveryPlanCandle {
  id: number;
  name: string;
  englishName: string;
  description: string | null;
  scentNotes: string[];
  aromaFamily: AromaFamily;
  burnTimeHours: number;
  price: number;
  matchScore: number;
  isReplacement: boolean;
  originalCandleId?: number;
}

export interface DeliveryPlan {
  subscriptionId: number;
  planName: string;
  deliveryNumber: number;
  scheduledDate: string;
  specialDate: SpecialDate | null;
  candles: DeliveryPlanCandle[];
  totalPrice: number;
  candleCount: number;
  estimatedBurnDays: number;
  conflictWarnings: ConflictWarning[];
  outOfStockNotes: string | null;
  deliveryNotes: string | null;
  replacements: ReplacementInfo[];
  restockPredictions: RestockPredictionItem[];
  nextPredictedDelivery: string;
}

export interface ReplacementInfo {
  original: { id: number; name: string };
  replacement: { id: number; name: string };
  reason: string;
}

export interface RestockPredictionItem {
  candle: string;
  prediction: RestockPrediction;
}

export interface SubscriptionWithDeliveries extends SubscriptionPlan {
  deliveries: DeliveryInfo[];
}

export type ScheduleSourceType = 'formula' | 'record' | 'subscription';
export type ScheduleFrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'completed';
export type RiskLevel = 'info' | 'warning' | 'danger';
export type RiskType = 'high_sensitivity' | 'subscription_review' | 'no_feedback' | 'usage_conflict' | 'long_no_feedback' | 'formula_conflict';

export interface Schedule {
  id: number;
  title: string;
  description: string | null;
  sourceType: ScheduleSourceType;
  source_type: ScheduleSourceType;
  sourceId: number | null;
  source_id: number | null;
  usagePart: string | null;
  usage_part: string | null;
  frequencyType: ScheduleFrequencyType;
  frequency_type: ScheduleFrequencyType;
  frequencyValue: number;
  frequency_value: number;
  frequencyDays: number[];
  frequency_days: number[];
  startDate: string;
  start_date: string;
  endDate: string | null;
  end_date: string | null;
  reminderTime: string | null;
  reminder_time: string | null;
  reminderEnabled: boolean;
  reminder_enabled: number;
  formulaId: number | null;
  formula_id: number | null;
  subscriptionId: number | null;
  subscription_id: number | null;
  status: ScheduleStatus;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  formulaName?: string;
  formula_name?: string;
  subscriptionName?: string;
  subscription_name?: string;
  completionCount?: number;
  lastCompletionDate?: string;
  completions?: ScheduleCompletion[];
  scheduledDate?: string;
  isToday?: boolean;
  isCompleted?: boolean;
  completion?: ScheduleCompletion;
}

export interface ScheduleCreateInput {
  title: string;
  description?: string | null;
  sourceType: ScheduleSourceType;
  sourceId?: number | null;
  usagePart?: string | null;
  frequencyType: ScheduleFrequencyType;
  frequencyValue?: number;
  frequencyDays?: number[];
  startDate: string;
  endDate?: string | null;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  formulaId?: number | null;
  subscriptionId?: number | null;
  status?: ScheduleStatus;
}

export interface ScheduleUpdateInput {
  title?: string;
  description?: string | null;
  sourceType?: ScheduleSourceType;
  sourceId?: number | null;
  usagePart?: string | null;
  frequencyType?: ScheduleFrequencyType;
  frequencyValue?: number;
  frequencyDays?: number[];
  startDate?: string;
  endDate?: string | null;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  formulaId?: number | null;
  subscriptionId?: number | null;
  status?: ScheduleStatus;
}

export interface ScheduleCompletion {
  id: number;
  scheduleId: number;
  schedule_id: number;
  scheduledDate: string;
  scheduled_date: string;
  completedAt: string;
  completed_at: string;
  notes: string | null;
  rating: number | null;
  createdAt: string;
  created_at: string;
}

export interface ScheduleCompletionInput {
  scheduledDate?: string;
  notes?: string | null;
  rating?: number | null;
}

export interface TodayReminderItem extends Schedule {
  isCompleted: boolean;
  completion?: ScheduleCompletion;
}

export interface TodayReminders {
  date: string;
  total: number;
  completed: number;
  pending: number;
  reminders: TodayReminderItem[];
}

export interface RiskWarning {
  type: RiskType;
  level: RiskLevel;
  scheduleId?: number;
  scheduleTitle?: string;
  formulaId?: number;
  formulaName?: string;
  formulaIds?: number[];
  formulaNames?: string[];
  subscriptionId?: number;
  planName?: string;
  usagePart?: string;
  frequencyType?: ScheduleFrequencyType;
  weeklyUseCount?: number;
  avgSensitivity?: number;
  sensitivityCount?: number;
  sensitiveIngredients?: string[];
  nextDeliveryDate?: string;
  daysUntilDelivery?: number;
  unreviewedDeliveries?: number;
  sourceType?: ScheduleSourceType;
  completionCount?: number;
  lastCompletionDate?: string;
  daysSinceStart?: number;
  message: string;
}

export interface RiskWarningsResponse {
  total: number;
  dangerCount: number;
  warningCount: number;
  infoCount: number;
  risks: RiskWarning[];
}

export interface CalendarDay {
  date: string;
  weekday: number;
  isToday: boolean;
  hasSchedules: boolean;
  scheduleCount: number;
  schedules: Schedule[];
}

export type ToleranceSourceType = 'formula' | 'ingredient';
export type ToleranceCycleType = '7days' | '14days' | 'custom';
export type TolerancePlanStatus = 'active' | 'paused' | 'completed' | 'interrupted' | 'failed';
export type TolerancePhaseStatus = 'pending' | 'in_progress' | 'completed' | 'extended' | 'interrupted';
export type ToleranceFrequencyType = 'every_two_days' | 'every_other_day' | 'daily' | 'twice_daily';
export type InterruptionSeverity = 'mild' | 'moderate' | 'severe';
export type AdaptationLevel = 'not_adapted' | 'poorly_adapted' | 'needs_more_data' | 'moderately_adapted' | 'well_adapted';

export interface TolerancePlanRiskWarning {
  level: 'info' | 'warning' | 'danger';
  type: string;
  message: string;
}

export interface TolerancePlanInsights {
  skinSensitivityLevel: number;
  hasSensitivityHistory: boolean;
  hasReactionHistory: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface TolerancePlanPhase {
  id?: number;
  planId?: number;
  plan_id?: number;
  phaseNumber: number;
  phase_number?: number;
  name: string;
  description?: string;
  startDate: string;
  start_date?: string;
  endDate: string;
  end_date?: string;
  durationDays: number;
  duration_days?: number;
  frequency: ToleranceFrequencyType;
  drops: number;
  goals: string[];
  status: TolerancePhaseStatus;
  completedAt?: string;
  completed_at?: string;
  extensionDays?: number;
  extension_days?: number;
  extensionReason?: string;
  extension_reason?: string;
  pauseConditions: string[];
  pause_conditions?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  extendedDays?: number;
  phaseGoal?: string;
  completionCriteria?: string;
  evaluationResult?: string;
}

export interface ToleranceDailyFeedback {
  id?: number;
  planId: number;
  plan_id?: number;
  phaseId: number;
  phase_id?: number;
  feedbackDate: string;
  feedback_date?: string;
  used: number;
  actualDrops?: number;
  actual_drops?: number;
  skinCondition?: string;
  skin_condition?: string;
  reactions: (string | Reaction)[];
  sensitivity?: number;
  comfort?: number;
  absorption?: number;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface ToleranceInterruption {
  id?: number;
  planId: number;
  plan_id?: number;
  phaseId?: number;
  phase_id?: number;
  interruptionDate: string;
  interruption_date?: string;
  startDate?: string;
  endDate?: string;
  reason: string;
  severity: InterruptionSeverity;
  symptoms: (string | Reaction)[];
  actions?: string[];
  resumedAt?: string;
  resumed_at?: string;
  resumeNotes?: string;
  resume_notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface TolerancePlan {
  id?: number;
  name: string;
  sourceType: ToleranceSourceType;
  source_type?: ToleranceSourceType;
  sourceId: number;
  source_id?: number;
  sourceName?: string;
  source_name?: string;
  cycleType: ToleranceCycleType;
  cycle_type?: ToleranceCycleType;
  customDays?: number;
  custom_days?: number;
  totalDays: number;
  total_days?: number;
  startDate: string;
  start_date?: string;
  endDate: string;
  end_date?: string;
  initialFrequency: ToleranceFrequencyType;
  initial_frequency?: ToleranceFrequencyType;
  initialDrops: number;
  initial_drops?: number;
  observationIndicators: string[];
  observation_indicators?: string;
  phaseGoals: string[];
  phase_goals?: string;
  skinSensitivityLevel: number;
  skin_sensitivity_level?: number;
  status: TolerancePlanStatus;
  currentPhase: number;
  current_phase?: number;
  progressPercent: number;
  progress_percent?: number;
  adaptationConclusion?: string;
  adaptation_conclusion?: string;
  recommendation?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  totalPhases?: number;
  completedPhases?: number;
  phases?: TolerancePlanPhase[];
  feedbacks?: ToleranceDailyFeedback[];
  interruptions?: ToleranceInterruption[];
  currentPhaseData?: TolerancePlanPhase;
  riskWarnings?: string[];
  insights?: TolerancePlanInsights;
  finalResult?: FinalEvaluationResult;
  currentDay?: number;
  observationMetrics?: string[];
}

export interface TolerancePlanCreateInput {
  sourceType: ToleranceSourceType;
  sourceId: number;
  cycleType: ToleranceCycleType;
  customDays?: number;
  startDate: string;
  initialFrequency: ToleranceFrequencyType;
  initialDrops: number;
  observationIndicators?: string[];
  phaseGoals?: string[];
  skinSensitivityLevel?: number;
  notes?: string;
}

export interface TolerancePlanUpdateInput {
  name?: string;
  notes?: string;
  status?: TolerancePlanStatus;
}

export interface ToleranceDailyFeedbackInput {
  phaseId: number;
  feedbackDate: string;
  used?: boolean;
  actualDrops?: number;
  skinCondition?: string;
  reactions?: (string | Reaction)[];
  sensitivity?: number;
  comfort?: number;
  absorption?: number;
  notes?: string;
}

export interface ToleranceInterruptionInput {
  phaseId?: number;
  interruptionDate: string;
  reason: string;
  severity: InterruptionSeverity;
  symptoms?: (string | Reaction)[];
  resumeNotes?: string;
  actions?: string[];
}

export interface ToleranceResumeInput {
  interruptionId?: number;
  resumeDate?: string;
  resumeNotes?: string;
}

export interface PhaseProceedInput {
  extendDays?: number;
  extendReason?: string;
}

export interface PauseConditionWarning {
  type: string;
  message: string;
  severity: 'warning' | 'danger';
}

export interface PhaseEvaluation {
  phaseId: number;
  completionRate: number;
  actualUsedDays: number;
  totalExpectedDays: number;
  avgSensitivity: number;
  avgComfort: number;
  hasAdverseReactions: boolean;
  interruptionCount: number;
  canProceed: boolean;
  needsExtension: boolean;
  shouldSuspend: boolean;
  recommendation: {
    action: 'proceed' | 'extend' | 'suspend' | 'observe';
    message: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
  };
  feedbacks: ToleranceDailyFeedback[];
}

export interface FinalEvaluationResult {
  planId: number;
  adaptationLevel: AdaptationLevel;
  conclusion: string;
  recommendation: string;
  maxToleratedDrops: number;
  recommendedFrequency: ToleranceFrequencyType;
  summary: string;
  suggestions: string[];
  scores: {
    completionRate: number;
    sensitivityScore: number;
    comfortScore: number;
    absorptionScore: number;
    safetyScore: number;
    overallScore: number;
  };
  stats: {
    totalDays: number;
    actualUsedDays: number;
    completionRate: number;
    phaseCompletionRate: number;
    avgSensitivity: number;
    avgComfort: number;
    avgAbsorption: number;
    severeInterruptions: number;
    moderateInterruptions: number;
    mildInterruptions: number;
  };
  phases: TolerancePlanPhase[];
  feedbacks: ToleranceDailyFeedback[];
  interruptions: ToleranceInterruption[];
}

export interface TolerancePlanConfigPreview {
  name: string;
  sourceType: ToleranceSourceType;
  sourceId: number;
  sourceName: string;
  cycleType: ToleranceCycleType;
  customDays?: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  initialFrequency: ToleranceFrequencyType;
  initialDrops: number;
  observationIndicators: string[];
  phaseGoals: string[];
  skinSensitivityLevel: number;
  status: TolerancePlanStatus;
  currentPhase: number;
  progressPercent: number;
  notes?: string;
  phases: TolerancePlanPhase[];
  riskWarnings: TolerancePlanRiskWarning[];
  insights: TolerancePlanInsights;
}

export interface ToleranceStatsSummary {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  interruptedPlans: number;
  pausedPlans: number;
  failedPlans: number;
  avgProgress: number;
  todayFeedbackCount: number;
}

export interface ToleranceDailyFeedbackResponse {
  success: boolean;
  data: ToleranceDailyFeedback;
  pauseWarnings: PauseConditionWarning[];
  progressPercent: number;
}
