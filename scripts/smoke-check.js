import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeApplication } from '../src/analyzer.js';
import { normalizeSamplePayload } from '../src/sample-normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const sample = normalizeSamplePayload(JSON.parse(await fs.readFile(path.join(root, 'data', 'sample.json'), 'utf8')));

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

console.log('Smoke check passed');
