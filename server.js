import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeApplication } from './src/analyzer.js';
import { searchAnnouncements } from './src/announcement-search.js';
import {
  extractBusinessRegistrationTextFromUpload,
  extractNoticeTextFromUpload,
  extractNoticeTextFromUrl,
  extractPreparedDocumentsFromUploads,
  extractTeamTextFromUpload,
  isUserInputError
} from './src/notice-importer.js';
import { extractRequirements } from './src/requirements.js';
import { normalizeSamplePayload } from './src/sample-normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 5173);
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const visionModel = process.env.OPENAI_VISION_MODEL || model;
const singleUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 1
  }
});
const documentsUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 12
  }
});

let runtimeApiKey = process.env.OPENAI_API_KEY || '';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

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
  res.json({ ok: true, hasKey: Boolean(runtimeApiKey), model, visionModel });
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
    model,
    visionModel
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

app.get('/api/announcements/search', async (req, res) => {
  try {
    const result = await searchAnnouncements(req.query);
    res.json(result);
  } catch (error) {
    console.error('[announcements:error]', error?.message || error);
    res.status(500).json({
      ok: false,
      error: '공고 검색 중 오류가 발생했습니다. 검색 조건을 줄이거나 잠시 후 다시 시도해 주세요.'
    });
  }
});

app.post('/api/requirements/extract', async (req, res) => {
  try {
    const noticeText = String(req.body?.noticeText || '').trim();
    const teamInfo = String(req.body?.teamInfo || '').trim();
    const businessRegistration = String(req.body?.businessRegistration || '').trim();

    if (!noticeText) {
      return res.status(400).json({
        ok: false,
        error: '공고문을 먼저 선택하거나 입력해야 합니다.'
      });
    }

    const result = await extractRequirements({
      noticeText,
      teamInfo: appendBusinessRegistrationToTeamInfo(teamInfo, businessRegistration),
      apiKey: runtimeApiKey,
      model
    });
    res.json(result);
  } catch (error) {
    console.error('[requirements:error]', error?.message || error);
    res.status(500).json({
      ok: false,
      error: '필요서류를 추출하는 중 오류가 발생했습니다.'
    });
  }
});

app.post('/api/import/notice/file', singleUpload.single('noticeFile'), async (req, res) => {
  try {
    const result = await extractNoticeTextFromUpload(req.file, openAiImportOptions());
    res.json(result);
  } catch (error) {
    sendImportError(res, error);
  }
});

app.post('/api/import/notice/url', async (req, res) => {
  try {
    const result = await extractNoticeTextFromUrl(req.body?.url, openAiImportOptions());
    res.json(result);
  } catch (error) {
    sendImportError(res, error);
  }
});

app.post('/api/import/team/file', singleUpload.single('teamFile'), async (req, res) => {
  try {
    const result = await extractTeamTextFromUpload(req.file, openAiImportOptions());
    res.json(result);
  } catch (error) {
    sendImportError(res, error, '팀 소개 파일을 불러오는 중 오류가 발생했습니다.');
  }
});

app.post('/api/import/business-registration/file', singleUpload.single('businessRegistrationFile'), async (req, res) => {
  try {
    const result = await extractBusinessRegistrationTextFromUpload(req.file, openAiImportOptions());
    res.json(result);
  } catch (error) {
    sendImportError(res, error, '사업자등록증 파일을 불러오는 중 오류가 발생했습니다.');
  }
});

app.post('/api/import/documents/files', documentsUpload.array('documentFiles', 12), async (req, res) => {
  try {
    const result = await extractPreparedDocumentsFromUploads(req.files, openAiImportOptions());
    res.json(result);
  } catch (error) {
    sendImportError(res, error, '준비서류 파일을 불러오는 중 오류가 발생했습니다.');
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const noticeText = String(req.body?.noticeText || '').trim();
    const teamInfo = String(req.body?.teamInfo || '').trim();
    const documentsList = String(req.body?.documentsList || '').trim();
    const businessRegistration = String(req.body?.businessRegistration || '').trim();

    if (!noticeText || !teamInfo) {
      return res.status(400).json({
        ok: false,
        error: '공고문과 팀 소개를 먼저 입력해야 합니다.'
      });
    }

    const result = await analyzeApplication({
      noticeText,
      teamInfo: appendBusinessRegistrationToTeamInfo(teamInfo, businessRegistration),
      documentsList: appendBusinessRegistrationToDocuments(documentsList, businessRegistration),
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

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, error: '파일은 각 12MB 이하로 업로드해 주세요. 준비서류는 한 번에 12개까지 가능합니다.' });
  }

  next(error);
});

function openAiImportOptions() {
  return {
    apiKey: runtimeApiKey,
    model: visionModel
  };
}

function appendBusinessRegistrationToTeamInfo(teamInfo, businessRegistration) {
  if (!businessRegistration) return teamInfo;

  return [
    teamInfo,
    '[사업자등록증 기본 정보]',
    businessRegistration
  ]
    .filter(Boolean)
    .join('\n\n');
}

function appendBusinessRegistrationToDocuments(documentsList, businessRegistration) {
  if (!businessRegistration) return documentsList;

  return [
    documentsList,
    '[사업자등록증 기본 정보]',
    '- 사업자등록증',
    businessRegistration
  ]
    .filter(Boolean)
    .join('\n\n');
}

function sendImportError(res, error, fallbackMessage = '공고문을 불러오는 중 오류가 발생했습니다.') {
  const status = isUserInputError(error) ? 400 : 500;
  if (status === 500) {
    console.error('[document-import:error]', error?.message || error);
  }

  res.status(status).json({
    ok: false,
    error: isUserInputError(error) ? error.message : fallbackMessage
  });
}

app.listen(port, () => {
  console.log(`GrantReady running at http://localhost:${port}`);
});
