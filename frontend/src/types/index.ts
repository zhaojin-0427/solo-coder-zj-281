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
