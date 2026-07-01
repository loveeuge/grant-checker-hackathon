import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAnnouncementNoticeText,
  normalizeKstartupAnnouncement,
  searchAnnouncements
} from '../src/announcement-search.js';
import { analyzeApplication } from '../src/analyzer.js';
import {
  extractNoticeTextFromUpload,
  extractNoticeTextFromUrl,
  extractBusinessRegistrationTextFromUpload,
  extractPreparedDocumentsFromUploads,
  extractTeamTextFromUpload
} from '../src/notice-importer.js';
import { extractRequirements } from '../src/requirements.js';
import { normalizeSamplePayload } from '../src/sample-normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const sample = normalizeSamplePayload(JSON.parse(await fs.readFile(path.join(root, 'data', 'sample.json'), 'utf8')));
const indexHtml = await fs.readFile(path.join(root, 'public', 'index.html'), 'utf8');
const appJs = await fs.readFile(path.join(root, 'public', 'app.js'), 'utf8');
const serverJs = await fs.readFile(path.join(root, 'server.js'), 'utf8');
const envExample = await fs.readFile(path.join(root, '.env.example'), 'utf8');

assert.ok(indexHtml.includes('id="requirements-panel"'));
assert.ok(indexHtml.includes('id="prepared-documents" hidden'));
assert.ok(indexHtml.includes('id="business-registration-file-input"'));
assert.ok(indexHtml.includes('id="business-registration-file-button"'));
assert.ok(indexHtml.includes('사업자등록증 불러오기'));
assert.ok(!indexHtml.includes('id="documents-file-button"'));
assert.ok(!indexHtml.includes('준비서류 첨부'));
assert.ok(!indexHtml.includes('href="./admin.html"'));
assert.ok(appJs.includes('"business-registration-file-input"'));
assert.ok(appJs.includes('businessRegistration: values.businessRegistration'));
assert.ok(appJs.includes('[사업자등록증 기본 정보]'));
assert.ok(appJs.includes('필요서류</th>'));
assert.ok(appJs.includes('왜 필요한가</th>'));
assert.ok(appJs.includes('오늘 해야 할 일 TOP 3'));
assert.ok(appJs.includes('첨부서류별 검토 결과'));
assert.ok(appJs.includes('서류 준비도'));
assert.ok(appJs.includes('선정 가능성 신호'));
assert.ok(appJs.includes('강점'));
assert.ok(appJs.includes('약점'));
assert.ok(!appJs.includes('선정 확정'));
assert.ok(!appJs.includes('탈락 확정'));
assert.ok(serverJs.includes('/api/import/business-registration/file'));
assert.ok(serverJs.includes('businessRegistration'));
assert.ok(envExample.includes('OPENAI_MODEL=gpt-5.5-pro'));
assert.ok(envExample.includes('OPENAI_VISION_MODEL=gpt-5.5-pro'));

const result = await analyzeApplication({
  noticeText: sample.noticeText,
  teamInfo: sample.teamInfo,
  documentsList: sample.documentsList,
  apiKey: '',
  model: 'demo'
});

assert.equal(result.mode, 'demo');
assert.ok(result.summary);
assert.ok(Array.isArray(result.eligibility));
assert.ok(Array.isArray(result.requiredDocuments));
assert.ok(Array.isArray(result.missingDocuments));
assert.ok(Array.isArray(result.finalChecklist));
assert.ok(result.missingDocuments.length >= 1);

const importedText = await extractNoticeTextFromUpload({
  buffer: Buffer.from('테스트 공고문\n제출서류: 사업계획서, 개인정보 동의서', 'utf8'),
  originalname: 'notice.txt',
  mimetype: 'text/plain'
});

assert.equal(importedText.ok, true);
assert.ok(importedText.text.includes('테스트 공고문'));

await assert.rejects(
  () =>
    extractNoticeTextFromUpload({
      buffer: Buffer.from('fake-image-bytes', 'utf8'),
      originalname: 'notice-photo.png',
      mimetype: 'image/png'
    }),
  /OpenAI API key/
);

const importedTeam = await extractTeamTextFromUpload({
  buffer: Buffer.from('회사소개서\n팀명: 체크메이트 랩스\n핵심기술: AI 문서 분석', 'utf8'),
  originalname: 'team.txt',
  mimetype: 'text/plain'
});

assert.equal(importedTeam.ok, true);
assert.ok(importedTeam.text.includes('체크메이트 랩스'));

const importedBusinessRegistration = await extractBusinessRegistrationTextFromUpload({
  buffer: Buffer.from('사업자등록증\n상호: 체크메이트 랩스\n사업장 소재지: 서울특별시 서대문구\n개업연월일: 2026-01-02', 'utf8'),
  originalname: 'business-registration.txt',
  mimetype: 'text/plain'
});

assert.equal(importedBusinessRegistration.ok, true);
assert.ok(importedBusinessRegistration.text.includes('서울특별시 서대문구'));

const importedPreparedDocuments = await extractPreparedDocumentsFromUploads([
  {
    buffer: Buffer.from('사업계획서 초안\n시장 분석과 예산 계획 포함', 'utf8'),
    originalname: 'business-plan.txt',
    mimetype: 'text/plain'
  },
  {
    buffer: Buffer.from('개인정보 수집 동의서 준비 예정', 'utf8'),
    originalname: 'privacy-consent.md',
    mimetype: 'text/markdown'
  },
  {
    buffer: Buffer.from('fake-image-bytes', 'utf8'),
    originalname: 'registration-photo.jpg',
    mimetype: 'image/jpeg'
  }
]);

assert.equal(importedPreparedDocuments.ok, true);
assert.equal(importedPreparedDocuments.documents.length, 3);
assert.equal(importedPreparedDocuments.documents.filter((document) => document.extracted).length, 2);
assert.ok(importedPreparedDocuments.text.includes('business-plan.txt'));
assert.ok(importedPreparedDocuments.text.includes('registration-photo.jpg'));

await assert.rejects(() => extractNoticeTextFromUrl('http://localhost:5173'));

const normalizedAnnouncement = normalizeKstartupAnnouncement({
  biz_pbanc_nm: 'AI 스타트업 사업화 지원사업',
  pbanc_ntrp_nm: '테스트 기관',
  supt_biz_clsfc: '사업화',
  supt_regin: '전국',
  aply_trgt: '예비창업자,일반기업',
  pbanc_rcpt_bgng_dt: '20260701',
  pbanc_rcpt_end_dt: '20260731',
  rcrt_prgs_yn: 'Y',
  pbanc_ctnt: 'AI 서비스 실증을 지원합니다.',
  detl_pg_url: 'https://www.k-startup.go.kr/test'
});

assert.equal(normalizedAnnouncement.source, 'kstartup');
assert.equal(normalizedAnnouncement.title, 'AI 스타트업 사업화 지원사업');
assert.ok(buildAnnouncementNoticeText(normalizedAnnouncement).includes('AI 서비스 실증'));

const bizinfoOnly = await searchAnnouncements({ source: 'bizinfo', keyword: 'AI' }, { BIZINFO_API_KEY: '' });
assert.equal(bizinfoOnly.ok, true);
assert.equal(bizinfoOnly.sources[0].status, 'skipped');

const requirements = await extractRequirements({
  noticeText:
    '제출서류: 지원신청서, 사업계획서, 사업자등록증, 개인정보 수집 이용 동의서\n지원대상: 서울 소재 예비창업자 및 일반기업',
  teamInfo: '서울 소재 예비창업팀이며 AI 문서 자동화 서비스를 준비 중입니다.'
});

assert.equal(requirements.ok, true);
assert.ok(requirements.requiredDocuments.some((document) => document.name.includes('사업계획서')));
assert.ok(requirements.eligibilityRequirements.length >= 1);

console.log('Smoke check passed');
