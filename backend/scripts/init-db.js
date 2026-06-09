import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'aroma.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('已删除旧数据库文件');
}

const db = new Database(dbPath);
console.log('数据库连接成功:', dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    english_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('base_oil', 'essential_oil')),
    description TEXT,
    effects TEXT NOT NULL DEFAULT '[]',
    contraindications TEXT NOT NULL DEFAULT '[]',
    skin_types TEXT NOT NULL DEFAULT '[]',
    aroma TEXT,
    color TEXT,
    viscosity TEXT,
    origin TEXT,
    pairing_suggestions TEXT NOT NULL DEFAULT '[]',
    safety_level INTEGER NOT NULL DEFAULT 1 CHECK(safety_level BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS formulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    purpose TEXT,
    effect_tags TEXT NOT NULL DEFAULT '[]',
    contraindications TEXT NOT NULL DEFAULT '[]',
    suitable_skin_types TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS formula_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formula_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('base_oil', 'essential_oil')),
    drops INTEGER NOT NULL,
    FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formula_id INTEGER,
    date TEXT NOT NULL,
    skin_condition_before TEXT,
    skin_condition_after TEXT,
    skin_condition TEXT,
    absorption INTEGER CHECK(absorption BETWEEN 1 AND 5),
    sensitivity INTEGER CHECK(sensitivity BETWEEN 1 AND 5),
    improvement INTEGER CHECK(improvement BETWEEN 1 AND 5),
    reactions TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS ingredient_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    reaction_type TEXT,
    description TEXT,
    severity INTEGER CHECK(severity BETWEEN 1 AND 5),
    sensitivity INTEGER CHECK(sensitivity BETWEEN 1 AND 5),
    improvement INTEGER CHECK(improvement BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES usage_records(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_ingredients_type ON ingredients(type);
  CREATE INDEX IF NOT EXISTS idx_formula_ingredients_formula ON formula_ingredients(formula_id);
  CREATE INDEX IF NOT EXISTS idx_formula_ingredients_ingredient ON formula_ingredients(ingredient_id);
  CREATE INDEX IF NOT EXISTS idx_usage_records_date ON usage_records(date);
  CREATE INDEX IF NOT EXISTS idx_usage_records_formula ON usage_records(formula_id);

  CREATE TABLE IF NOT EXISTS candles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    english_name TEXT NOT NULL,
    description TEXT,
    scent_notes TEXT NOT NULL DEFAULT '[]',
    aroma_family TEXT NOT NULL,
    burn_time_hours INTEGER NOT NULL,
    weight_grams INTEGER NOT NULL,
    price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    safety_level INTEGER NOT NULL DEFAULT 1 CHECK(safety_level BETWEEN 1 AND 5),
    origin TEXT,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT,
    recipient_address TEXT NOT NULL,
    delivery_cycle TEXT NOT NULL CHECK(delivery_cycle IN ('weekly', 'biweekly', 'monthly')),
    budget_limit REAL NOT NULL,
    candles_per_delivery INTEGER NOT NULL DEFAULT 2,
    delivery_scene TEXT NOT NULL,
    preferred_aromas TEXT NOT NULL DEFAULT '[]',
    excluded_scents TEXT NOT NULL DEFAULT '[]',
    special_dates TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled', 'completed')),
    user_notes TEXT,
    start_date TEXT NOT NULL,
    next_delivery_date TEXT,
    total_deliveries INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscription_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL,
    delivery_number INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    actual_delivery_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'generated', 'shipped', 'delivered', 'cancelled')),
    total_price REAL NOT NULL DEFAULT 0,
    candle_count INTEGER NOT NULL DEFAULT 0,
    estimated_burn_days INTEGER NOT NULL DEFAULT 0,
    conflict_warnings TEXT NOT NULL DEFAULT '[]',
    out_of_stock_notes TEXT,
    delivery_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS delivery_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    candle_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    is_replacement INTEGER NOT NULL DEFAULT 0,
    original_candle_id INTEGER,
    replacement_reason TEXT,
    match_score REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (delivery_id) REFERENCES subscription_deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY (candle_id) REFERENCES candles(id)
  );

  CREATE INDEX IF NOT EXISTS idx_candles_aroma_family ON candles(aroma_family);
  CREATE INDEX IF NOT EXISTS idx_candles_active ON candles(is_active);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscription_plans(status);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery ON subscription_plans(next_delivery_date);
  CREATE INDEX IF NOT EXISTS idx_deliveries_subscription ON subscription_deliveries(subscription_id);
  CREATE INDEX IF NOT EXISTS idx_deliveries_status ON subscription_deliveries(status);
  CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON subscription_deliveries(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_delivery_contents_delivery ON delivery_contents(delivery_id);
  CREATE INDEX IF NOT EXISTS idx_delivery_contents_candle ON delivery_contents(candle_id);
`);

console.log('数据表创建成功');

const insertIngredient = db.prepare(`
  INSERT INTO ingredients (
    name, english_name, type, description, effects, contraindications,
    skin_types, aroma, color, viscosity, origin, pairing_suggestions, safety_level
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const baseOils = [
  {
    name: '甜杏仁油',
    english_name: 'Sweet Almond Oil',
    type: 'base_oil',
    description: '质地轻柔的基础油，富含维生素E和脂肪酸，具有良好的滋润性和渗透性，适合各种肤质使用。',
    effects: ['滋润保湿', '舒缓肌肤', '改善干燥', '抗氧化', '软化角质'],
    contraindications: ['对坚果过敏者禁用'],
    skin_types: ['干性', '中性', '敏感性', '熟龄性'],
    aroma: '淡淡的坚果香',
    color: '淡黄色',
    viscosity: '轻盈',
    origin: '地中海地区',
    pairing_suggestions: ['薰衣草', '茶树', '玫瑰', '洋甘菊'],
    safety_level: 1
  },
  {
    name: '荷荷巴油',
    english_name: 'Jojoba Oil',
    type: 'base_oil',
    description: '其实是一种液态蜡，分子结构与人体皮脂相似，极易被皮肤吸收，具有极佳的保湿和调节皮脂分泌的功效。',
    effects: ['调节皮脂', '深层保湿', '预防粉刺', '抗氧化', '修复屏障'],
    contraindications: [],
    skin_types: ['油性', '混合性', '干性', '敏感性', '痘痘肌'],
    aroma: '几乎无味',
    color: '金黄色',
    viscosity: '中等',
    origin: '美国西南部、墨西哥',
    pairing_suggestions: ['茶树', '薄荷', '柠檬', '天竺葵'],
    safety_level: 1
  },
  {
    name: '玫瑰果油',
    english_name: 'Rosehip Oil',
    type: 'base_oil',
    description: '富含维生素A、C和必需脂肪酸，具有卓越的修复和再生能力，被誉为"精油皇后的黄金搭档"。',
    effects: ['促进修复', '淡化疤痕', '抗氧化', '改善暗沉', '促进胶原蛋白生成'],
    contraindications: ['敏感肌肤慎用', '妊娠期慎用'],
    skin_types: ['熟龄性', '干性', '混合性'],
    aroma: '淡淡的草本香',
    color: '橙红色',
    viscosity: '中等偏稠',
    origin: '智利',
    pairing_suggestions: ['玫瑰', '乳香', '橙花', '洋甘菊'],
    safety_level: 2
  },
  {
    name: '椰子油',
    english_name: 'Coconut Oil',
    type: 'base_oil',
    description: '富含中链脂肪酸，具有天然的抗菌特性，在温度低于25°C时会凝固成白色固体。',
    effects: ['抗菌消炎', '深层滋养', '防晒修复', '软化肌肤', '促进新陈代谢'],
    contraindications: ['油性肌肤慎用', '易致粉刺'],
    skin_types: ['干性', '中性', '敏感性'],
    aroma: '浓郁的椰子香',
    color: '无色或白色',
    viscosity: '低温时凝固',
    origin: '菲律宾、印度尼西亚',
    pairing_suggestions: ['薄荷', '茶树', '柠檬', '依兰依兰'],
    safety_level: 1
  },
  {
    name: '橄榄油',
    english_name: 'Olive Oil',
    type: 'base_oil',
    description: '最经典的基础油之一，富含维生素E和多酚类抗氧化物质，具有出色的滋润和抗氧化功效。',
    effects: ['深层滋润', '抗氧化', '舒缓修复', '增强弹性', '温和清洁'],
    contraindications: ['油性肌肤慎用', '易致粉刺'],
    skin_types: ['干性', '中性', '熟龄性', '敏感性'],
    aroma: '橄榄清香',
    color: '黄绿色',
    viscosity: '较稠',
    origin: '地中海地区',
    pairing_suggestions: ['薰衣草', '洋甘菊', '橙花', '玫瑰'],
    safety_level: 1
  },
  {
    name: '葡萄籽油',
    english_name: 'Grapeseed Oil',
    type: 'base_oil',
    description: '由葡萄种子冷压萃取而成，质地清爽不油腻，富含原花青素，是极佳的抗氧化基础油。',
    effects: ['抗氧化', '收敛毛孔', '平衡油脂', '保湿不油腻', '改善暗沉'],
    contraindications: [],
    skin_types: ['油性', '混合性', '中性', '痘痘肌'],
    aroma: '淡淡的葡萄香',
    color: '淡绿色',
    viscosity: '非常轻盈',
    origin: '法国、意大利',
    pairing_suggestions: ['天竺葵', '薄荷', '柠檬', '茶树'],
    safety_level: 1
  }
];

const essentialOils = [
  {
    name: '薰衣草',
    english_name: 'Lavender',
    type: 'essential_oil',
    description: '精油界的"万能油"，用途最广泛的精油之一，具有出色的舒缓、镇静和修复功效。',
    effects: ['舒缓镇静', '促进睡眠', '消炎杀菌', '促进修复', '淡化痘印', '缓解焦虑'],
    contraindications: ['孕期前三个月慎用', '低血压者慎用'],
    skin_types: ['干性', '油性', '混合性', '敏感性', '痘痘肌'],
    aroma: '清新草本香，带花香调',
    color: '无色至淡黄色',
    viscosity: '轻盈',
    origin: '法国普罗旺斯、保加利亚',
    pairing_suggestions: ['洋甘菊', '橙花', '乳香', '天竺葵', '茶树'],
    safety_level: 1
  },
  {
    name: '茶树',
    english_name: 'Tea Tree',
    type: 'essential_oil',
    description: '澳洲原住民的传统灵药，具有强大的抗菌、抗病毒功效，是处理痘痘和肌肤问题的首选。',
    effects: ['抗菌消炎', '祛痘控油', '增强免疫', '清洁毛孔', '抗真菌'],
    contraindications: ['敏感性肌肤需稀释', '避免接触眼睛'],
    skin_types: ['油性', '混合性', '痘痘肌'],
    aroma: '强烈的清凉药草香',
    color: '无色至淡黄色',
    viscosity: '轻盈',
    origin: '澳大利亚',
    pairing_suggestions: ['薰衣草', '薄荷', '柠檬', '天竺葵'],
    safety_level: 2
  },
  {
    name: '玫瑰',
    english_name: 'Rose',
    type: 'essential_oil',
    description: '精油中的"皇后"，价格昂贵但功效卓越，具有极佳的滋养和美容功效，能提升女性魅力。',
    effects: ['滋养肌肤', '淡化细纹', '提亮肤色', '舒缓情绪', '调节内分泌', '促进血液循环'],
    contraindications: ['孕期前三个月禁用', '乳腺疾病患者慎用'],
    skin_types: ['干性', '熟龄性', '敏感性', '暗沉肌'],
    aroma: '浓郁的玫瑰花香',
    color: '淡黄色至淡绿色',
    viscosity: '中等',
    origin: '保加利亚、摩洛哥、土耳其',
    pairing_suggestions: ['乳香', '橙花', '洋甘菊', '依兰依兰'],
    safety_level: 2
  },
  {
    name: '柠檬',
    english_name: 'Lemon',
    type: 'essential_oil',
    description: '清新明快的柑橘类精油，具有出色的美白、控油和提神功效，是最受欢迎的精油之一。',
    effects: ['美白亮肤', '控油收敛', '提神醒脑', '促进代谢', '抗菌消毒', '淡化色素'],
    contraindications: ['光敏性，使用后避免日晒', '敏感性肌肤慎用', '高浓度可能刺激皮肤'],
    skin_types: ['油性', '混合性', '暗沉肌'],
    aroma: '清新的柠檬果香',
    color: '淡黄色至黄绿色',
    viscosity: '轻盈',
    origin: '意大利、美国、阿根廷',
    pairing_suggestions: ['薄荷', '茶树', '天竺葵', '依兰依兰'],
    safety_level: 3
  },
  {
    name: '薄荷',
    english_name: 'Peppermint',
    type: 'essential_oil',
    description: '清凉舒爽的代表精油，具有极强的提神和抗炎功效，能给肌肤带来清新凉爽的感觉。',
    effects: ['清凉止痒', '消炎祛痘', '提神醒脑', '收缩毛孔', '缓解头痛', '调节皮脂'],
    contraindications: ['孕期禁用', '哺乳期慎用', '避免接触眼睛', '高血压患者慎用'],
    skin_types: ['油性', '混合性', '痘痘肌', '头皮问题'],
    aroma: '强烈的清凉薄荷香',
    color: '无色至淡黄色',
    viscosity: '轻盈',
    origin: '美国、印度、英国',
    pairing_suggestions: ['柠檬', '茶树', '薰衣草', '天竺葵'],
    safety_level: 3
  },
  {
    name: '橙花',
    english_name: 'Neroli',
    type: 'essential_oil',
    description: '高贵优雅的花香精油，由苦橙花蒸馏萃取，具有极佳的舒缓和美白功效，被誉为"公主之油"。',
    effects: ['舒缓敏感', '美白淡斑', '促进细胞再生', '改善焦虑', '增强弹性', '平衡油脂'],
    contraindications: ['孕期前三个月慎用'],
    skin_types: ['干性', '敏感性', '熟龄性', '暗沉肌'],
    aroma: '清新淡雅的花香，带柑橘调',
    color: '淡黄色',
    viscosity: '轻盈',
    origin: '摩洛哥、法国、埃及',
    pairing_suggestions: ['玫瑰', '乳香', '洋甘菊', '薰衣草'],
    safety_level: 2
  },
  {
    name: '洋甘菊',
    english_name: 'Chamomile',
    type: 'essential_oil',
    description: '温和的"植物医生"，具有出色的抗敏感和舒缓功效，是最安全的精油之一，适合儿童使用。',
    effects: ['舒缓抗敏', '消炎镇静', '改善红血丝', '促进修复', '缓解压力', '改善湿疹'],
    contraindications: ['对菊科植物过敏者慎用'],
    skin_types: ['敏感性', '干性', '痘痘肌', '婴儿肌肤'],
    aroma: '温暖的草木香，带苹果香',
    color: '淡蓝色',
    viscosity: '轻盈',
    origin: '德国、罗马、埃及',
    pairing_suggestions: ['薰衣草', '玫瑰', '橙花', '乳香'],
    safety_level: 1
  },
  {
    name: '乳香',
    english_name: 'Frankincense',
    type: 'essential_oil',
    description: '古老而珍贵的精油，被誉为"精油之王"，具有极佳的修复和抗老化功效，历史悠久。',
    effects: ['抗老紧致', '促进修复', '淡化疤痕', '舒缓情绪', '增强免疫', '改善皱纹'],
    contraindications: ['孕期前三个月慎用'],
    skin_types: ['熟龄性', '干性', '敏感性', '受损肌肤'],
    aroma: '温暖的树脂香，带木质调',
    color: '淡黄色至淡褐色',
    viscosity: '中等偏稠',
    origin: '阿曼、索马里、埃塞俄比亚',
    pairing_suggestions: ['玫瑰', '橙花', '薰衣草', '洋甘菊'],
    safety_level: 2
  },
  {
    name: '依兰依兰',
    english_name: 'Ylang Ylang',
    type: 'essential_oil',
    description: '浓郁甜美的花香精油，被称为"花中之花"，具有极佳的调节情绪和平衡油脂功效。',
    effects: ['平衡油脂', '舒缓压力', '改善暗沉', '调节荷尔蒙', '增强自信', '修护受损'],
    contraindications: ['高浓度可能引起头痛', '孕期前三个月慎用'],
    skin_types: ['油性', '混合性', '干性', '暗沉肌'],
    aroma: '浓郁甜美的热带花香',
    color: '淡黄色',
    viscosity: '中等',
    origin: '马达加斯加、科摩罗群岛',
    pairing_suggestions: ['玫瑰', '柠檬', '天竺葵', '薄荷'],
    safety_level: 2
  },
  {
    name: '天竺葵',
    english_name: 'Geranium',
    type: 'essential_oil',
    description: '平衡能力极强的精油，被称为"小玫瑰"，能有效调节油脂分泌和荷尔蒙平衡。',
    effects: ['平衡油脂', '收敛毛孔', '促进循环', '舒缓情绪', '改善水肿', '抗菌消炎'],
    contraindications: ['孕期慎用', '雌激素相关疾病患者慎用'],
    skin_types: ['油性', '混合性', '干性', '痘痘肌'],
    aroma: '甜美的玫瑰香，带青草调',
    color: '无色至淡绿色',
    viscosity: '轻盈',
    origin: '埃及、法国、中国',
    pairing_suggestions: ['薰衣草', '茶树', '柠檬', '玫瑰'],
    safety_level: 2
  }
];

console.log('正在插入基础油数据...');
baseOils.forEach(oil => {
  insertIngredient.run(
    oil.name,
    oil.english_name,
    oil.type,
    oil.description,
    JSON.stringify(oil.effects),
    JSON.stringify(oil.contraindications),
    JSON.stringify(oil.skin_types),
    oil.aroma,
    oil.color,
    oil.viscosity,
    oil.origin,
    JSON.stringify(oil.pairing_suggestions),
    oil.safety_level
  );
});
console.log(`已插入 ${baseOils.length} 种基础油`);

console.log('正在插入单方精油数据...');
essentialOils.forEach(oil => {
  insertIngredient.run(
    oil.name,
    oil.english_name,
    oil.type,
    oil.description,
    JSON.stringify(oil.effects),
    JSON.stringify(oil.contraindications),
    JSON.stringify(oil.skin_types),
    oil.aroma,
    oil.color,
    oil.viscosity,
    oil.origin,
    JSON.stringify(oil.pairing_suggestions),
    oil.safety_level
  );
});
console.log(`已插入 ${essentialOils.length} 种单方精油`);

const insertFormula = db.prepare(`
  INSERT INTO formulas (name, description, purpose, effect_tags, contraindications, suitable_skin_types, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertFormulaIngredient = db.prepare(`
  INSERT INTO formula_ingredients (formula_id, ingredient_id, type, drops)
  VALUES (?, ?, ?, ?)
`);

const insertUsageRecord = db.prepare(`
  INSERT INTO usage_records (formula_id, date, skin_condition_before, skin_condition_after, skin_condition, absorption, sensitivity, improvement, reactions, notes, rating)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const formulas = [
  {
    name: '舒缓修护配方',
    description: '专为敏感性和受损肌肤设计的温和配方，能够舒缓镇静肌肤，促进修复。',
    purpose: '日常保湿修护',
    baseOils: [{ id: 1, drops: 30 }, { id: 2, drops: 10 }],
    essentialOils: [{ id: 7, drops: 3 }, { id: 8, drops: 2 }],
    notes: '适合晚间使用，配合轻柔按摩效果更佳'
  },
  {
    name: '控油祛痘配方',
    description: '针对油性和痘痘肌肤的调理配方，能有效平衡油脂分泌，消炎祛痘。',
    purpose: '控油祛痘调理',
    baseOils: [{ id: 2, drops: 25 }, { id: 6, drops: 15 }],
    essentialOils: [{ id: 2, drops: 3 }, { id: 5, drops: 2 }, { id: 10, drops: 2 }],
    notes: '日间使用清爽不油腻，点涂痘痘效果更好'
  },
  {
    name: '抗老紧致配方',
    description: '为熟龄肌肤设计的滋养配方，富含抗氧化成分，能淡化细纹，提升肌肤弹性。',
    purpose: '抗老紧致保养',
    baseOils: [{ id: 3, drops: 25 }, { id: 1, drops: 15 }],
    essentialOils: [{ id: 3, drops: 2 }, { id: 8, drops: 3 }, { id: 6, drops: 2 }],
    notes: '建议晚间使用，配合面部按摩手法效果显著'
  },
  {
    name: '提亮焕肤配方',
    description: '改善暗沉肤色，提亮肌肤的美白配方，让肌肤焕发光彩。',
    purpose: '美白提亮',
    baseOils: [{ id: 6, drops: 20 }, { id: 2, drops: 20 }],
    essentialOils: [{ id: 4, drops: 3 }, { id: 6, drops: 2 }, { id: 10, drops: 2 }],
    notes: '夜间使用，使用后务必避光，建议配合防晒'
  },
  {
    name: '放松助眠配方',
    description: '舒缓身心压力，帮助入眠的放松配方，适合睡前使用。',
    purpose: '放松助眠',
    baseOils: [{ id: 5, drops: 30 }, { id: 1, drops: 10 }],
    essentialOils: [{ id: 1, drops: 3 }, { id: 7, drops: 2 }, { id: 9, drops: 1 }],
    notes: '睡前1小时使用，可配合冥想或深呼吸'
  }
];

console.log('正在插入示例配方数据...');
formulas.forEach((formula, index) => {
  const allIngredients = [
    ...formula.baseOils.map(o => ({ ...o, type: 'base_oil' })),
    ...formula.essentialOils.map(o => ({ ...o, type: 'essential_oil' }))
  ];

  const ingredientIds = allIngredients.map(o => o.id);
  const placeholders = ingredientIds.map(() => '?').join(', ');
  const ingredients = db.prepare(
    `SELECT id, effects, contraindications, skin_types FROM ingredients WHERE id IN (${placeholders})`
  ).all(...ingredientIds);

  const ingredientMap = new Map();
  ingredients.forEach(ing => {
    ingredientMap.set(ing.id, {
      effects: JSON.parse(ing.effects || '[]'),
      contraindications: JSON.parse(ing.contraindications || '[]'),
      skin_types: JSON.parse(ing.skin_types || '[]')
    });
  });

  const effectTagsSet = new Set();
  const contraindicationsSet = new Set();
  const skinTypesArrays = [];

  allIngredients.forEach(({ id }) => {
    const data = ingredientMap.get(id);
    if (!data) return;
    data.effects.forEach(e => effectTagsSet.add(e));
    data.contraindications.forEach(c => contraindicationsSet.add(c));
    if (data.skin_types.length > 0) {
      skinTypesArrays.push(data.skin_types);
    }
  });

  let suitableSkinTypes = [];
  if (skinTypesArrays.length > 0) {
    suitableSkinTypes = skinTypesArrays.reduce((intersection, current) => {
      return intersection.filter(type => current.includes(type));
    });
  }

  const formulaId = insertFormula.run(
    formula.name,
    formula.description,
    formula.purpose,
    JSON.stringify(Array.from(effectTagsSet)),
    JSON.stringify(Array.from(contraindicationsSet)),
    JSON.stringify(suitableSkinTypes),
    formula.notes
  ).lastInsertRowid;

  formula.baseOils.forEach(oil => {
    insertFormulaIngredient.run(formulaId, oil.id, 'base_oil', oil.drops);
  });

  formula.essentialOils.forEach(oil => {
    insertFormulaIngredient.run(formulaId, oil.id, 'essential_oil', oil.drops);
  });

  console.log(`已创建配方 ${index + 1}: ${formula.name}`);
});

const usageRecords = [
  {
    formulaId: 1,
    date: '2026-06-01',
    skinConditionBefore: '肌肤干燥，有轻微泛红',
    skinConditionAfter: '泛红减轻，肌肤感觉滋润',
    skinCondition: '正常',
    absorption: 4,
    sensitivity: 2,
    improvement: 4,
    reactions: [],
    notes: '使用后感觉很舒缓，没有刺激感',
    rating: 4
  },
  {
    formulaId: 1,
    date: '2026-06-03',
    skinConditionBefore: '泛红有所改善，但仍干燥',
    skinConditionAfter: '持续使用中，肌肤状态稳定',
    skinCondition: '正常',
    absorption: 5,
    sensitivity: 1,
    improvement: 5,
    reactions: [],
    notes: '配合保湿喷雾使用效果更好',
    rating: 5
  },
  {
    formulaId: 2,
    date: '2026-06-02',
    skinConditionBefore: 'T区出油严重，有几颗痘痘',
    skinConditionAfter: '痘痘有所收敛，出油减少',
    skinCondition: '油腻',
    absorption: 4,
    sensitivity: 2,
    improvement: 4,
    reactions: ['轻微清凉感'],
    notes: '点涂痘痘效果不错',
    rating: 4
  },
  {
    formulaId: 2,
    date: '2026-06-04',
    skinConditionBefore: '痘痘改善中，仍有痘印',
    skinConditionAfter: '痘印有所淡化',
    skinCondition: '痘痘',
    absorption: 4,
    sensitivity: 2,
    improvement: 4,
    reactions: [],
    notes: '建议配合防晒使用',
    rating: 4
  },
  {
    formulaId: 3,
    date: '2026-06-01',
    skinConditionBefore: '肌肤松弛，有细纹',
    skinConditionAfter: '感觉肌肤紧致了一些',
    skinCondition: '正常',
    absorption: 5,
    sensitivity: 1,
    improvement: 5,
    reactions: ['温热感'],
    notes: '配合按摩手法，吸收很好',
    rating: 5
  },
  {
    formulaId: 4,
    date: '2026-06-02',
    skinConditionBefore: '肤色暗沉，无光泽',
    skinConditionAfter: '感觉肤色提亮了',
    skinCondition: '敏感',
    absorption: 3,
    sensitivity: 4,
    improvement: 3,
    reactions: ['轻微刺痛感'],
    notes: '初次使用有轻微刺痛，可能需要建立耐受',
    rating: 3
  },
  {
    formulaId: 5,
    date: '2026-06-05',
    skinConditionBefore: '压力大，难以入眠',
    skinConditionAfter: '感觉放松了很多',
    skinCondition: '正常',
    absorption: 5,
    sensitivity: 1,
    improvement: 5,
    reactions: ['放松感'],
    notes: '睡前使用，配合深呼吸，入睡更快了',
    rating: 5
  },
  {
    formulaId: 5,
    date: '2026-06-07',
    skinConditionBefore: '焦虑，睡眠质量差',
    skinConditionAfter: '睡眠质量有所改善',
    skinCondition: '正常',
    absorption: 5,
    sensitivity: 1,
    improvement: 4,
    reactions: [],
    notes: '持续使用中，效果稳定',
    rating: 5
  }
];

console.log('正在插入示例使用记录数据...');
usageRecords.forEach((record, index) => {
  insertUsageRecord.run(
    record.formulaId,
    record.date,
    record.skinConditionBefore,
    record.skinConditionAfter,
    record.skinCondition,
    record.absorption,
    record.sensitivity,
    record.improvement,
    JSON.stringify(record.reactions),
    record.notes,
    record.rating
  );
  console.log(`已创建使用记录 ${index + 1}`);
});

const insertCandle = db.prepare(`
  INSERT INTO candles (
    name, english_name, description, scent_notes, aroma_family,
    burn_time_hours, weight_grams, price, stock_quantity,
    safety_level, origin, image_url, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const candles = [
  {
    name: '薰衣草梦境',
    english_name: 'Lavender Dream',
    description: '宁静舒缓的薰衣草香气，帮助放松身心，促进深度睡眠。',
    scent_notes: ['薰衣草', '洋甘菊', '香草'],
    aroma_family: 'floral',
    burn_time_hours: 60,
    weight_grams: 200,
    price: 128.00,
    stock_quantity: 50,
    safety_level: 1,
    origin: '法国普罗旺斯',
    image_url: null,
    is_active: 1
  },
  {
    name: '玫瑰花园',
    english_name: 'Rose Garden',
    description: '浓郁优雅的大马士革玫瑰香调，带来浪漫温馨的氛围。',
    scent_notes: ['玫瑰', '天竺葵', '乳香'],
    aroma_family: 'floral',
    burn_time_hours: 55,
    weight_grams: 180,
    price: 168.00,
    stock_quantity: 35,
    safety_level: 1,
    origin: '保加利亚',
    image_url: null,
    is_active: 1
  },
  {
    name: '柑橘晨光',
    english_name: 'Citrus Morning',
    description: '清新明快的柑橘果香，提神醒脑，开启活力满满的一天。',
    scent_notes: ['柠檬', '甜橙', '佛手柑'],
    aroma_family: 'citrus',
    burn_time_hours: 50,
    weight_grams: 180,
    price: 98.00,
    stock_quantity: 45,
    safety_level: 1,
    origin: '意大利西西里',
    image_url: null,
    is_active: 1
  },
  {
    name: '森林秘境',
    english_name: 'Forest Sanctuary',
    description: '深邃的木质调香气，仿佛置身于原始森林之中。',
    scent_notes: ['雪松', '檀香', '乳香'],
    aroma_family: 'woody',
    burn_time_hours: 65,
    weight_grams: 220,
    price: 158.00,
    stock_quantity: 30,
    safety_level: 1,
    origin: '印度',
    image_url: null,
    is_active: 1
  },
  {
    name: '薄荷清风',
    english_name: 'Mint Breeze',
    description: '清凉爽快的薄荷香气，消暑解热，净化空气。',
    scent_notes: ['薄荷', '尤加利', '茶树'],
    aroma_family: 'herbal',
    burn_time_hours: 45,
    weight_grams: 160,
    price: 88.00,
    stock_quantity: 40,
    safety_level: 2,
    origin: '美国',
    image_url: null,
    is_active: 1
  },
  {
    name: '海洋之心',
    english_name: 'Ocean Heart',
    description: '清新海洋调，带来海风拂面的清爽感觉。',
    scent_notes: ['海盐', '海藻', '白麝香'],
    aroma_family: 'fresh',
    burn_time_hours: 55,
    weight_grams: 190,
    price: 118.00,
    stock_quantity: 25,
    safety_level: 1,
    origin: '法国',
    image_url: null,
    is_active: 1
  },
  {
    name: '香草布丁',
    english_name: 'Vanilla Pudding',
    description: '甜蜜温暖的香草香氛，营造温馨舒适的居家氛围。',
    scent_notes: ['香草', '焦糖', '肉桂'],
    aroma_family: 'gourmand',
    burn_time_hours: 50,
    weight_grams: 180,
    price: 108.00,
    stock_quantity: 38,
    safety_level: 1,
    origin: '马达加斯加',
    image_url: null,
    is_active: 1
  },
  {
    name: '东方神韵',
    english_name: 'Oriental Charm',
    description: '神秘东方调，融合檀香、麝香与香料的馥郁香气。',
    scent_notes: ['檀香', '麝香', '肉豆蔻'],
    aroma_family: 'oriental',
    burn_time_hours: 70,
    weight_grams: 230,
    price: 198.00,
    stock_quantity: 20,
    safety_level: 2,
    origin: '中东',
    image_url: null,
    is_active: 1
  },
  {
    name: '茉莉花香',
    english_name: 'Jasmine Bloom',
    description: '清雅高贵的茉莉花香，舒缓情绪，提升魅力。',
    scent_notes: ['茉莉', '橙花', '依兰依兰'],
    aroma_family: 'floral',
    burn_time_hours: 55,
    weight_grams: 180,
    price: 148.00,
    stock_quantity: 0,
    safety_level: 1,
    origin: '埃及',
    image_url: null,
    is_active: 1
  },
  {
    name: '秋日暖阳',
    english_name: 'Autumn Glow',
    description: '温暖的肉桂与苹果香调，感受秋日丰收的喜悦。',
    scent_notes: ['肉桂', '苹果', '丁香'],
    aroma_family: 'spicy',
    burn_time_hours: 60,
    weight_grams: 200,
    price: 138.00,
    stock_quantity: 28,
    safety_level: 1,
    origin: '中国',
    image_url: null,
    is_active: 1
  }
];

console.log('正在插入香薰蜡烛数据...');
candles.forEach((candle, index) => {
  insertCandle.run(
    candle.name,
    candle.english_name,
    candle.description,
    JSON.stringify(candle.scent_notes),
    candle.aroma_family,
    candle.burn_time_hours,
    candle.weight_grams,
    candle.price,
    candle.stock_quantity,
    candle.safety_level,
    candle.origin,
    candle.image_url,
    candle.is_active
  );
  console.log(`已创建蜡烛 ${index + 1}: ${candle.name}`);
});

const ingredientCount = db.prepare('SELECT COUNT(*) as count FROM ingredients').get().count;
const formulaCount = db.prepare('SELECT COUNT(*) as count FROM formulas').get().count;
const usageCount = db.prepare('SELECT COUNT(*) as count FROM usage_records').get().count;
const candleCount = db.prepare('SELECT COUNT(*) as count FROM candles').get().count;

console.log('\n========================================');
console.log('数据库初始化完成！');
console.log('========================================');
console.log(`成分数据: ${ingredientCount} 条（${baseOils.length} 种基础油 + ${essentialOils.length} 种单方精油）`);
console.log(`配方数据: ${formulaCount} 条`);
console.log(`使用记录: ${usageCount} 条`);
console.log(`蜡烛产品: ${candleCount} 条`);
console.log('========================================');

db.close();
console.log('数据库连接已关闭');
