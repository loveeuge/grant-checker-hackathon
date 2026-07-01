import dns from 'node:dns/promises';
import net from 'node:net';
import path from 'node:path';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import mammoth from 'mammoth';

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_URL_BYTES = 12 * 1024 * 1024;
const MAX_NOTICE_CHARS = 60000;
const URL_TIMEOUT_MS = 12000;
const DEFAULT_VISION_MODEL = 'gpt-5.4-mini';

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.html', '.htm']);
const TEXT_MIME_PREFIXES = ['text/'];
const TEXT_MIME_TYPES = new Set([
  'application/json',
  'application/xml',
  'application/xhtml+xml',
  'application/csv'
]);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const IMAGE_TEXT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['documentType', 'text', 'summary', 'warnings'],
  properties: {
    documentType: { type: 'string' },
    text: { type: 'string' },
    summary: { type: 'string' },
    warnings: { type: 'array', items: { type: 'string' } }
  }
};

export async function extractNoticeTextFromUpload(file, options = {}) {
  return extractTextFromUpload(file, {
    emptyMessage: '공고문 파일을 선택해 주세요.',
    filename: 'uploaded-notice',
    emptyTextMessage: '텍스트를 추출하지 못했습니다. 스캔 이미지 PDF라면 사진 파일로 첨부하거나 텍스트 PDF/공고 URL을 사용해 주세요.',
    imagePurpose: 'grant_notice',
    ...options
  });
}

export async function extractTeamTextFromUpload(file, options = {}) {
  return extractTextFromUpload(file, {
    emptyMessage: '팀 소개 파일을 선택해 주세요.',
    filename: 'uploaded-team-profile',
    emptyTextMessage: '텍스트를 추출하지 못했습니다. 이미지 중심 파일이라면 JPG/PNG 사진으로 첨부하거나 텍스트가 포함된 PDF, PPTX, DOCX 파일을 사용해 주세요.',
    imagePurpose: 'team_profile',
    ...options
  });
}

export async function extractBusinessRegistrationTextFromUpload(file, options = {}) {
  return extractTextFromUpload(file, {
    emptyMessage: '사업자등록증 파일을 선택해 주세요.',
    filename: 'uploaded-business-registration',
    emptyTextMessage: '텍스트를 추출하지 못했습니다. 스캔 이미지라면 JPG/PNG 사진으로 첨부하거나 텍스트가 포함된 PDF 파일을 사용해 주세요.',
    imagePurpose: 'business_registration',
    ...options
  });
}

export async function extractPreparedDocumentsFromUploads(files, options = {}) {
  if (!Array.isArray(files) || !files.length) {
    throw new UserInputError('준비서류 파일을 선택해 주세요.');
  }

  const documents = [];

  for (const file of files) {
    const name = file.originalname || 'prepared-document';

    try {
      const result = await extractTextFromUpload(file, {
        emptyMessage: '준비서류 파일을 선택해 주세요.',
        filename: name,
        emptyTextMessage: '텍스트를 추출하지 못했습니다.',
        imagePurpose: 'prepared_document',
        ...options
      });
      const preview = toDocumentPreview(result.text);

      documents.push({
        name,
        kind: result.source.kind,
        bytes: result.source.bytes,
        characters: result.source.characters,
        extracted: true,
        preview,
        line: [
          `- ${name}`,
          `  추출상태: ${result.source.kind.toUpperCase()} 텍스트 ${result.source.characters.toLocaleString('ko-KR')}자 추출`,
          preview ? `  내용 일부: ${preview}` : ''
        ]
          .filter(Boolean)
          .join('\n')
      });
    } catch (error) {
      documents.push({
        name,
        kind: path.extname(name).replace('.', '').toLowerCase() || 'file',
        bytes: file.buffer?.length || 0,
        characters: 0,
        extracted: false,
        warning: error.message || '텍스트를 추출하지 못했습니다.',
        preview: '',
        line: `- ${name}\n  추출상태: 첨부됨, 내용 미추출 (${error.message || '텍스트 없음'})`
      });
    }
  }

  return {
    ok: true,
    text: documents.map((document) => document.line).join('\n'),
    documents
  };
}

export async function extractNoticeTextFromUrl(rawUrl, options = {}) {
  const url = await normalizeAndCheckUrl(rawUrl);
  const response = await fetch(url.href, {
    headers: {
      accept: 'text/html,application/pdf,text/plain,application/json,*/*;q=0.7',
      'user-agent': 'GrantReady-Hackathon-Demo/0.1'
    },
    signal: AbortSignal.timeout(URL_TIMEOUT_MS),
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new UserInputError(`URL을 불러오지 못했습니다. HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const buffer = await readResponseBuffer(response, MAX_URL_BYTES);
  const finalUrl = response.url || url.href;

  return extractNoticeTextFromBuffer({
    buffer,
    filename: new URL(finalUrl).pathname || url.pathname,
    mimeType: contentType,
    sourceUrl: finalUrl,
    emptyTextMessage: '텍스트를 추출하지 못했습니다. 스캔 이미지 PDF라면 사진 파일로 첨부하거나 텍스트 PDF/공고 URL을 사용해 주세요.',
    imagePurpose: 'grant_notice',
    ...options
  });
}

export function isUserInputError(error) {
  return error instanceof UserInputError;
}

class UserInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserInputError';
  }
}

async function extractTextFromUpload(file, { emptyMessage, filename, emptyTextMessage, imagePurpose, apiKey, model }) {
  if (!file?.buffer?.length) {
    throw new UserInputError(emptyMessage);
  }

  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new UserInputError('파일은 12MB 이하만 불러올 수 있습니다.');
  }

  return extractNoticeTextFromBuffer({
    buffer: file.buffer,
    filename: file.originalname || filename,
    mimeType: file.mimetype || '',
    emptyTextMessage,
    imagePurpose,
    apiKey,
    model
  });
}

async function extractNoticeTextFromBuffer({
  buffer,
  filename,
  mimeType,
  sourceUrl = '',
  emptyTextMessage = '',
  imagePurpose = 'document',
  apiKey = '',
  model = DEFAULT_VISION_MODEL
}) {
  const extension = path.extname(filename || '').toLowerCase();
  const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  let text = '';
  let kind = 'file';

  if (normalizedMime === 'application/pdf' || extension === '.pdf') {
    text = await extractPdfText(buffer);
    kind = 'pdf';
  } else if (
    normalizedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === '.docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || '';
    kind = 'docx';
  } else if (
    normalizedMime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    extension === '.pptx'
  ) {
    text = await extractPptxText(buffer);
    kind = 'pptx';
  } else if (isHtmlLike(normalizedMime, extension)) {
    text = htmlToText(decodeText(buffer));
    kind = 'html';
  } else if (isTextLike(normalizedMime, extension)) {
    text = normalizeTextFile(decodeText(buffer), extension);
    kind = extension === '.json' || normalizedMime === 'application/json' ? 'json' : 'text';
  } else if (isImageLike(normalizedMime, extension)) {
    text = await extractImageText(buffer, {
      apiKey,
      filename,
      imagePurpose,
      mimeType: normalizedMime || guessImageMimeType(extension),
      model
    });
    kind = 'image';
  } else {
    throw new UserInputError('지원하지 않는 파일 형식입니다. PDF, DOCX, PPTX, TXT, MD, CSV, JSON, HTML, JPG, PNG, WEBP, GIF 파일을 사용해 주세요.');
  }

  const cleaned = cleanExtractedText(text);
  if (!cleaned) {
    throw new UserInputError(emptyTextMessage || '텍스트를 추출하지 못했습니다. 텍스트가 포함된 PDF, DOCX, PPTX, TXT 파일을 사용해 주세요.');
  }

  const truncated = cleaned.length > MAX_NOTICE_CHARS;
  const outputText = truncated ? cleaned.slice(0, MAX_NOTICE_CHARS) : cleaned;

  return {
    ok: true,
    text: outputText,
    source: {
      kind,
      filename: filename || '',
      url: sourceUrl,
      mimeType: normalizedMime || mimeType || '',
      bytes: buffer.length,
      characters: outputText.length,
      truncated
    }
  };
}

async function extractImageText(buffer, { apiKey, filename, imagePurpose, mimeType, model }) {
  const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!trimmedKey) {
    throw new UserInputError('사진 파일 텍스트 추출은 관리자 화면에서 OpenAI API key를 등록한 뒤 사용할 수 있습니다.');
  }

  const imageMimeType = mimeType || guessImageMimeType(path.extname(filename || '').toLowerCase());
  if (!IMAGE_MIME_TYPES.has(imageMimeType)) {
    throw new UserInputError('사진 파일은 JPG, PNG, WEBP, GIF 형식을 사용해 주세요.');
  }

  const OpenAI = await loadOpenAI();
  const client = new OpenAI({ apiKey: trimmedKey });
  const selectedModel = String(model || DEFAULT_VISION_MODEL).trim() || DEFAULT_VISION_MODEL;
  let response;

  try {
    response = await client.responses.create({
      model: selectedModel,
      input: [
        {
          role: 'system',
          content:
            '당신은 한국어 문서 이미지 OCR 보조자입니다. 보이는 텍스트만 추출하고 추측하지 마세요. 주민등록번호, 계좌번호, 상세주소, 연락처, 이메일 등 개인정보와 고유식별정보는 원문을 반복하지 말고 [마스킹]으로 대체하세요.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildImageExtractionPrompt({ filename, imagePurpose })
            },
            {
              type: 'input_image',
              image_url: `data:${imageMimeType};base64,${buffer.toString('base64')}`,
              detail: 'high'
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'document_image_extraction',
          schema: IMAGE_TEXT_SCHEMA,
          strict: true
        }
      },
      max_output_tokens: 1800
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw new UserInputError('OpenAI API key가 유효하지 않거나 이미지 분석 권한이 없습니다. 관리자 화면에서 key를 다시 확인해 주세요.');
    }

    if (error?.status === 400) {
      throw new UserInputError('사진을 읽지 못했습니다. JPG, PNG, WEBP, GIF 형식의 선명한 이미지를 사용해 주세요.');
    }

    throw error;
  }

  const parsed = parseJsonFromResponse(response);
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.filter(Boolean) : [];
  return [
    `[이미지 문서: ${filename || 'uploaded-image'}]`,
    parsed.documentType ? `문서유형: ${parsed.documentType}` : '',
    parsed.text ? `추출텍스트:\n${parsed.text}` : '',
    parsed.summary ? `요약: ${parsed.summary}` : '',
    warnings.length ? `주의: ${warnings.join(' / ')}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

async function loadOpenAI() {
  const module = await import('openai');
  const OpenAI = module.default || module.OpenAI;

  if (!OpenAI) {
    throw new Error('OpenAI SDK not available');
  }

  return OpenAI;
}

function buildImageExtractionPrompt({ filename, imagePurpose }) {
  const purposeLabel =
    {
      grant_notice: '지원사업 공고문',
      team_profile: '팀/회사 소개 자료',
      business_registration: '사업자등록증',
      prepared_document: '준비서류'
    }[imagePurpose] || '문서';

  return [
    `${purposeLabel} 이미지 파일 "${filename || 'uploaded-image'}"에서 텍스트를 추출하세요.`,
    '반환 JSON 작성 기준:',
    '- documentType에는 보이는 문서 종류를 짧게 적으세요.',
    '- text에는 이미지에서 읽을 수 있는 문구를 원문 순서대로 정리하세요.',
    '- summary에는 신청 검토에 필요한 핵심만 1~2문장으로 요약하세요.',
    '- warnings에는 흐림, 잘림, 서명/도장 누락, 개인정보 포함 가능성, 판독불가 영역을 적으세요.',
    '- 숫자, 날짜, 제출서류명, 지원대상, 기관명은 보이는 범위에서 최대한 유지하세요.',
    '- 확실하지 않은 글자는 [판독불가]로 표시하세요.'
  ].join('\n');
}

function parseJsonFromResponse(response) {
  const candidates = [
    response?.output_text,
    ...(Array.isArray(response?.output)
      ? response.output.flatMap((item) => (Array.isArray(item.content) ? item.content.map((part) => part.text || part.value || '') : []))
      : [])
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next response text shape.
    }
  }

  throw new Error('OpenAI image extraction response was not valid JSON');
}

async function extractPdfText(buffer) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
}

async function extractPptxText(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)\.xml$/)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml$/)?.[1] || 0));

  const slides = [];
  for (const slidePath of slidePaths) {
    const xml = await zip.files[slidePath].async('string');
    const $ = cheerio.load(xml, { xmlMode: true });
    const fragments = [];

    $('a\\:t, t').each((_index, element) => {
      const value = cleanInlineText($(element).text());
      if (value) fragments.push(value);
    });

    if (fragments.length) {
      slides.push(fragments.join(' '));
    }
  }

  return slides.map((slide, index) => `[슬라이드 ${index + 1}] ${slide}`).join('\n');
}

function htmlToText(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, canvas, nav, header, footer, iframe').remove();

  const pieces = [];
  const title = cleanInlineText($('title').first().text());
  if (title) pieces.push(title);

  $('h1, h2, h3, p, li, th, td, caption, strong').each((_index, element) => {
    const value = cleanInlineText($(element).text());
    if (value && !pieces.includes(value)) pieces.push(value);
  });

  if (pieces.length < 8) {
    const bodyText = cleanInlineText($('body').text());
    if (bodyText) pieces.push(bodyText);
  }

  return pieces.join('\n');
}

function normalizeTextFile(text, extension) {
  if (extension === '.json') {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  return text;
}

function toDocumentPreview(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
}

async function normalizeAndCheckUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) throw new UserInputError('공고문 URL을 입력해 주세요.');
  if (value.length > 2000) throw new UserInputError('URL이 너무 깁니다.');

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new UserInputError('URL 형식이 올바르지 않습니다.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new UserInputError('http 또는 https URL만 불러올 수 있습니다.');
  }

  if (url.username || url.password) {
    throw new UserInputError('계정 정보가 포함된 URL은 사용할 수 없습니다.');
  }

  await assertPublicHost(url.hostname);
  return url;
}

async function assertPublicHost(hostname) {
  const lowerHost = hostname.toLowerCase();
  if (['localhost', 'localhost.localdomain'].includes(lowerHost) || lowerHost.endsWith('.local')) {
    throw new UserInputError('보안을 위해 로컬/사설 주소는 URL 불러오기를 막았습니다.');
  }

  if (net.isIP(lowerHost)) {
    if (isPrivateAddress(lowerHost)) {
      throw new UserInputError('보안을 위해 로컬/사설 주소는 URL 불러오기를 막았습니다.');
    }
    return;
  }

  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: false });
  } catch {
    throw new UserInputError('URL의 호스트를 확인할 수 없습니다.');
  }

  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new UserInputError('보안을 위해 로컬/사설 주소는 URL 불러오기를 막았습니다.');
  }
}

function isPrivateAddress(address) {
  if (address === '::1') return true;
  if (address.startsWith('fe80:') || address.startsWith('fc') || address.startsWith('fd')) return true;

  if (!net.isIP(address) || net.isIP(address) !== 4) return false;
  const [a, b] = address.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

async function readResponseBuffer(response, maxBytes) {
  if (!response.body) {
    return Buffer.from(await response.arrayBuffer());
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new UserInputError('URL에서 받은 파일이 12MB를 넘습니다.');
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

function isHtmlLike(mimeType, extension) {
  return mimeType.includes('html') || extension === '.html' || extension === '.htm';
}

function isTextLike(mimeType, extension) {
  return TEXT_EXTENSIONS.has(extension) || TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) || TEXT_MIME_TYPES.has(mimeType);
}

function isImageLike(mimeType, extension) {
  return IMAGE_MIME_TYPES.has(mimeType) || IMAGE_EXTENSIONS.has(extension);
}

function guessImageMimeType(extension) {
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  return '';
}

function decodeText(buffer) {
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

function cleanExtractedText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function cleanInlineText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
