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

export default {
  ingredients,
  formulas,
  records,
  analysis,
  statistics,
};
