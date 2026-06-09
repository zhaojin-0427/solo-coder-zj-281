import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import formulasRouter from './routes/formulas.js';
import ingredientsRouter from './routes/ingredients.js';
import recordsRouter from './routes/records.js';
import analysisRouter from './routes/analysis.js';
import statisticsRouter from './routes/statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 9102;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function initDatabase() {
  const dbPath = path.join(__dirname, '../data/aroma.db');
  if (!fs.existsSync(dbPath)) {
    console.log('数据库不存在，正在初始化...');
    try {
      const initScriptPath = path.join(__dirname, '../scripts/init-db.js');
      execSync(`node ${initScriptPath}`, { stdio: 'inherit' });
      console.log('数据库初始化完成');
    } catch (error) {
      console.error('数据库初始化失败:', error.message);
      process.exit(1);
    }
  }
}

initDatabase();

app.use('/api/formulas', formulasRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/statistics', statisticsRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
