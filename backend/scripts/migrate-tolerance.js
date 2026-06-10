import fs from 'fs';
import { db } from '../src/db/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'aroma.db');

if (!fs.existsSync(dbPath)) {
  console.log('数据库不存在，请先运行 init-db.js');
  process.exit(1);
}

console.log('数据库连接成功:', dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS tolerance_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('formula', 'ingredient')),
    source_id INTEGER NOT NULL,
    source_name TEXT,
    cycle_type TEXT NOT NULL CHECK(cycle_type IN ('7days', '14days', 'custom')),
    custom_days INTEGER,
    total_days INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    initial_frequency TEXT NOT NULL,
    initial_drops INTEGER NOT NULL,
    observation_indicators TEXT NOT NULL DEFAULT '[]',
    phase_goals TEXT NOT NULL DEFAULT '[]',
    skin_sensitivity_level INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'interrupted', 'failed')),
    current_phase INTEGER NOT NULL DEFAULT 1,
    progress_percent REAL NOT NULL DEFAULT 0,
    adaptation_conclusion TEXT,
    recommendation TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tolerance_plan_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    phase_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    drops INTEGER NOT NULL,
    goals TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'extended', 'interrupted')),
    completed_at DATETIME,
    extension_days INTEGER DEFAULT 0,
    extension_reason TEXT,
    pause_conditions TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES tolerance_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tolerance_plan_daily_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    phase_id INTEGER NOT NULL,
    feedback_date TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    actual_drops INTEGER,
    skin_condition TEXT,
    reactions TEXT NOT NULL DEFAULT '[]',
    sensitivity INTEGER CHECK(sensitivity BETWEEN 1 AND 5),
    comfort INTEGER CHECK(comfort BETWEEN 1 AND 5),
    absorption INTEGER CHECK(absorption BETWEEN 1 AND 5),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES tolerance_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES tolerance_plan_phases(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tolerance_plan_interruptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    phase_id INTEGER,
    interruption_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('mild', 'moderate', 'severe')),
    symptoms TEXT NOT NULL DEFAULT '[]',
    resumed_at TEXT,
    resume_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES tolerance_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES tolerance_plan_phases(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tolerance_plans_source ON tolerance_plans(source_type, source_id);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plans_status ON tolerance_plans(status);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plans_dates ON tolerance_plans(start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plan_phases_plan ON tolerance_plan_phases(plan_id);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plan_phases_status ON tolerance_plan_phases(status);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plan_feedback_plan ON tolerance_plan_daily_feedback(plan_id);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plan_feedback_date ON tolerance_plan_daily_feedback(feedback_date);
  CREATE INDEX IF NOT EXISTS idx_tolerance_plan_interruptions_plan ON tolerance_plan_interruptions(plan_id);
`);

console.log('耐受计划表创建成功');

const tableCount = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'tolerance%'
`).all();

console.log('已创建的表:', tableCount.map(t => t.name).join(', '));

db.close();
console.log('数据库连接已关闭');
