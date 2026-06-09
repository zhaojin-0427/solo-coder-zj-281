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
