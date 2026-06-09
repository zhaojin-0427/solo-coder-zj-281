import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/aroma.db');
const db = new Database(dbPath);

console.log('正在迁移数据库，添加日程相关表...');

db.exec(`
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL CHECK(source_type IN ('formula', 'record', 'subscription')),
    source_id INTEGER,
    usage_part TEXT,
    frequency_type TEXT NOT NULL CHECK(frequency_type IN ('daily', 'weekly', 'monthly', 'custom')),
    frequency_value INTEGER DEFAULT 1,
    frequency_days TEXT DEFAULT '[]',
    start_date TEXT NOT NULL,
    end_date TEXT,
    reminder_time TEXT,
    reminder_enabled INTEGER NOT NULL DEFAULT 1,
    formula_id INTEGER,
    subscription_id INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS schedule_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_schedules_source ON schedules(source_type, source_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
  CREATE INDEX IF NOT EXISTS idx_schedules_dates ON schedules(start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_schedules_formula ON schedules(formula_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_subscription ON schedules(subscription_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_completions_schedule ON schedule_completions(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_completions_date ON schedule_completions(scheduled_date);
`);

console.log('数据表创建成功，正在插入示例数据...');

const insertSchedule = db.prepare(`
  INSERT INTO schedules (
    title, description, source_type, source_id, usage_part,
    frequency_type, frequency_value, frequency_days,
    start_date, end_date, reminder_time, reminder_enabled,
    formula_id, subscription_id, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertScheduleCompletion = db.prepare(`
  INSERT INTO schedule_completions (schedule_id, scheduled_date, notes, rating)
  VALUES (?, ?, ?, ?)
`);

const sampleSchedules = [
  {
    title: '晚间舒缓修护',
    description: '每日晚间使用舒缓修护配方进行面部护理',
    sourceType: 'formula',
    sourceId: 1,
    usagePart: '面部',
    frequencyType: 'daily',
    frequencyValue: 1,
    frequencyDays: [],
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    reminderTime: '21:00',
    reminderEnabled: 1,
    formulaId: 1,
    subscriptionId: null,
    status: 'active'
  },
  {
    title: '每周控油护理',
    description: '每周二、四、六使用控油祛痘配方',
    sourceType: 'formula',
    sourceId: 2,
    usagePart: '面部T区',
    frequencyType: 'weekly',
    frequencyValue: 3,
    frequencyDays: [2, 4, 6],
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    reminderTime: '20:00',
    reminderEnabled: 1,
    formulaId: 2,
    subscriptionId: null,
    status: 'active'
  },
  {
    title: '订阅礼盒使用计划',
    description: '配合订阅礼盒配送周期的使用安排',
    sourceType: 'subscription',
    sourceId: null,
    usagePart: '室内香薰',
    frequencyType: 'weekly',
    frequencyValue: 2,
    frequencyDays: [1, 5],
    startDate: '2026-06-01',
    endDate: null,
    reminderTime: '19:30',
    reminderEnabled: 1,
    formulaId: null,
    subscriptionId: null,
    status: 'active'
  }
];

sampleSchedules.forEach((schedule, index) => {
  insertSchedule.run(
    schedule.title,
    schedule.description,
    schedule.sourceType,
    schedule.sourceId,
    schedule.usagePart,
    schedule.frequencyType,
    schedule.frequencyValue,
    JSON.stringify(schedule.frequencyDays),
    schedule.startDate,
    schedule.endDate,
    schedule.reminderTime,
    schedule.reminderEnabled,
    schedule.formulaId,
    schedule.subscriptionId,
    schedule.status
  );
  console.log(`已创建日程 ${index + 1}: ${schedule.title}`);
});

const today = new Date();
for (let i = 1; i <= 3; i++) {
  const date = new Date(today);
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];
  
  insertScheduleCompletion.run(
    1,
    dateStr,
    `使用后感觉舒缓，肌肤状态稳定`,
    5
  );
  console.log(`已创建打卡记录: ${dateStr}`);
}

const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get().count;
const completionCount = db.prepare('SELECT COUNT(*) as count FROM schedule_completions').get().count;

console.log('\n========================================');
console.log('数据库迁移完成！');
console.log('========================================');
console.log(`日程计划: ${scheduleCount} 条`);
console.log(`打卡记录: ${completionCount} 条`);
console.log('========================================');

db.close();
console.log('数据库连接已关闭');
