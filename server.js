import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeApplication } from './src/analyzer.js';
import { normalizeSamplePayload } from './src/sample-normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 5173);
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

let runtimeApiKey = process.env.OPENAI_API_KEY || '';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken) return next();

  const token = req.get('x-admin-token') || req.body?.adminToken;
  if (token !== configuredToken) {
    return res.status(401).json({
      ok: false,
      error: '관리자 토큰이 필요합니다.'
    });
  }

  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(runtimeApiKey), model });
});

app.get('/api/admin/status', (_req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(runtimeApiKey),
    source: runtimeApiKey
      ? process.env.OPENAI_API_KEY
        ? 'environment'
        : 'runtime-admin'
      : 'not-configured',
    model
  });
});

app.post('/api/admin/key', requireAdmin, (req, res) => {
  const apiKey = String(req.body?.apiKey || '').trim();

  if (!apiKey.startsWith('sk-')) {
    return res.status(400).json({
      ok: false,
      error: 'OpenAI API key 형식이 올바르지 않습니다. sk-로 시작하는 키를 입력하세요.'
    });
  }

  runtimeApiKey = apiKey;
  res.json({
    ok: true,
    hasKey: true,
    message: 'API key가 서버 메모리에 저장되었습니다. 브라우저에는 다시 표시하지 않습니다.'
  });
});

app.delete('/api/admin/key', requireAdmin, (_req, res) => {
  if (process.env.OPENAI_API_KEY) {
    runtimeApiKey = process.env.OPENAI_API_KEY;
    return res.json({
      ok: true,
      hasKey: true,
      message: '.env의 OPENAI_API_KEY가 있어 런타임 키만 초기화했습니다.'
    });
  }

  runtimeApiKey = '';
  res.json({ ok: true, hasKey: false, message: '서버 메모리의 API key를 삭제했습니다.' });
});

app.get('/api/sample', async (_req, res) => {
  const samplePath = path.join(__dirname, 'data', 'sample.json');
  const sample = JSON.parse(await fs.readFile(samplePath, 'utf8'));
  res.json(normalizeSamplePayload(sample));
});

app.post('/api/analyze', async (req, res) => {
  try {
    const noticeText = String(req.body?.noticeText || '').trim();
    const teamInfo = String(req.body?.teamInfo || '').trim();
    const documentsList = String(req.body?.documentsList || '').trim();

    if (!noticeText || !teamInfo || !documentsList) {
      return res.status(400).json({
        ok: false,
        error: '공고문, 팀 소개, 준비 서류 목록을 모두 입력해야 합니다.'
      });
    }

    const result = await analyzeApplication({
      noticeText,
      teamInfo,
      documentsList,
      apiKey: runtimeApiKey,
      model
    });

    res.json({ ok: true, result });
  } catch (error) {
    console.error('[analyze:error]', error?.message || error);
    res.status(500).json({
      ok: false,
      error: '분석 중 오류가 발생했습니다. 입력을 줄이거나 API key 상태를 확인하세요.'
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(port, () => {
  console.log(`GrantReady running at http://localhost:${port}`);
});
