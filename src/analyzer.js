const DEFAULT_MODEL = 'gpt-5.4-mini';

const SAFETY_NOTICE =
  '이 결과는 1차 준비 체크리스트이며 최종 지원 가능 여부를 단정하지 않습니다. 개인정보와 고유식별정보는 제출 전 최소화하거나 마스킹하고, 공고 원문 및 담당 기관 확인이 필요합니다.';

const DOCUMENT_HINTS = [
  {
    name: '지원신청서',
    aliases: ['지원신청서', '신청서', '사업 신청서', '참가신청서', '온라인 신청서']
  },
  {
    name: '사업계획서',
    aliases: ['사업계획서', '수행계획서', '사업 수행계획서', '제안서', '계획서']
  },
  {
    name: '팀/기업 소개 자료',
    aliases: ['팀 소개', '기업 소개', '회사소개서', '소개서', 'IR', '발표자료', '피치덱']
  },
  {
    name: '개인정보 수집·이용 동의서',
    aliases: ['개인정보', '개인정보 수집', '개인정보 이용', '개인정보 동의서', '수집·이용 동의서']
  },
  {
    name: '참여확약서/서약서',
    aliases: ['확약서', '서약서', '참여확약서', '성실이행']
  },
  {
    name: '사업자등록증',
    aliases: ['사업자등록증', '사업자 등록증', '사업자등록', '고유번호증']
  },
  {
    name: '법인등기부등본',
    aliases: ['법인등기부등본', '등기부등본', '법인 등기', '등기사항전부증명서']
  },
  {
    name: '국세/지방세 납세증명서',
    aliases: ['국세', '지방세', '납세증명서', '완납증명서', '체납']
  },
  {
    name: '재무제표/매출 증빙',
    aliases: ['재무제표', '부가가치세', '매출', '손익계산서', '표준재무제표', '회계']
  },
  {
    name: '4대보험/고용 증빙',
    aliases: ['4대보험', '고용보험', '가입자 명부', '직원 수', '상시근로자']
  },
  {
    name: '참여인력 이력서',
    aliases: ['이력서', '참여인력', '인력 현황', '전담인력', '대표자 약력']
  },
  {
    name: '견적서/비교견적서',
    aliases: ['견적서', '비교견적', '산출내역', '예산 산출', '거래명세']
  },
  {
    name: '통장 사본',
    aliases: ['통장 사본', '통장사본', '계좌 사본', '입금계좌']
  },
  {
    name: '지식재산권/인증 증빙',
    aliases: ['특허', '상표', '지식재산', '인증서', '수상', '실적 증빙']
  }
];

const ELIGIBILITY_HINTS = [
  {
    item: '지원 대상 유형',
    keywords: ['지원대상', '신청대상', '대상기업', '창업기업', '예비창업', '중소기업', '소상공인'],
    question: '팀이 공고의 지원 대상 유형에 정확히 해당하는지 확인하세요.'
  },
  {
    item: '소재지/지역 요건',
    keywords: ['소재지', '본사', '사업장', '관내', '지역', '소재 기업'],
    question: '본사, 지점, 대표자 주소 등 공고가 요구하는 지역 기준을 확인하세요.'
  },
  {
    item: '업력/설립일 요건',
    keywords: ['업력', '창업', '설립', '개업', '년 이내', '사업자등록일'],
    question: '사업자등록일 또는 설립일 기준으로 업력 계산이 맞는지 확인하세요.'
  },
  {
    item: '업종/사업 분야 적합성',
    keywords: ['업종', '분야', '기술', '산업', '지원분야', '과제'],
    question: '팀의 제품/서비스가 공고의 지원 분야와 어떻게 연결되는지 한 문장으로 정리하세요.'
  },
  {
    item: '제외/제한 요건',
    keywords: ['제외', '제한', '체납', '휴업', '폐업', '부도', '제재', '중복지원'],
    question: '체납, 제재, 중복지원, 휴폐업 등 제외 사유가 없는지 증빙 기준으로 확인하세요.'
  },
  {
    item: '접수 기간/제출 방식',
    keywords: ['접수기간', '마감', '제출기한', '온라인', '이메일', '방문접수', '우편'],
    question: '마감 시각, 제출 채널, 파일 형식 제한을 별도로 캘린더에 기록하세요.'
  }
];

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mode',
    'summary',
    'eligibility',
    'requiredDocuments',
    'missingDocuments',
    'improvementQuestions',
    'finalChecklist',
    'risks',
    'nextActions'
  ],
  properties: {
    mode: { type: 'string', enum: ['ai', 'demo'] },
    summary: { type: 'string' },
    eligibility: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['item', 'status', 'evidence', 'question'],
        properties: {
          item: { type: 'string' },
          status: { type: 'string' },
          evidence: { type: 'string' },
          question: { type: 'string' }
        }
      }
    },
    requiredDocuments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'status', 'evidence', 'action'],
        properties: {
          name: { type: 'string' },
          status: { type: 'string' },
          evidence: { type: 'string' },
          action: { type: 'string' }
        }
      }
    },
    missingDocuments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'reason', 'priority'],
        properties: {
          name: { type: 'string' },
          reason: { type: 'string' },
          priority: { type: 'string' }
        }
      }
    },
    improvementQuestions: { type: 'array', items: { type: 'string' } },
    finalChecklist: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['item', 'status', 'ownerHint'],
        properties: {
          item: { type: 'string' },
          status: { type: 'string' },
          ownerHint: { type: 'string' }
        }
      }
    },
    risks: { type: 'array', items: { type: 'string' } },
    nextActions: { type: 'array', items: { type: 'string' } }
  }
};

export async function analyzeApplication({
  noticeText = '',
  teamInfo = '',
  documentsList = '',
  apiKey = '',
  model = DEFAULT_MODEL
} = {}) {
  const normalizedInput = {
    noticeText: toSafeText(noticeText),
    teamInfo: toSafeText(teamInfo),
    documents: normalizeDocumentsList(documentsList)
  };

  const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  const selectedModel = toSafeText(model) || DEFAULT_MODEL;

  if (!trimmedKey || selectedModel.toLowerCase() === 'demo') {
    return buildDemoAnalysis(normalizedInput);
  }

  try {
    const OpenAI = await loadOpenAI();
    const client = new OpenAI({ apiKey: trimmedKey });
    const response = await client.responses.create({
      model: selectedModel,
      input: [
        {
          role: 'system',
          content:
            '당신은 한국 지원사업 공고 1차 검토 보조자입니다. 최종 지원 가능 여부를 단정하지 말고 모든 적격성 판단은 "확인 필요" 중심으로 작성하세요. 개인정보, 고유식별정보, 연락처, 계좌번호는 원문 그대로 반복하지 말고 최소화하세요. 반드시 요청된 JSON 구조만 반환하세요.'
        },
        {
          role: 'user',
          content: buildPrompt(normalizedInput)
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'grant_application_checklist',
          schema: RESPONSE_SCHEMA,
          strict: true
        }
      },
      max_output_tokens: 2400
    });

    const parsed = parseJsonFromResponse(response);
    return finalizeAnalysis({ ...parsed, mode: 'ai' }, normalizedInput);
  } catch {
    return buildDemoAnalysis(normalizedInput);
  }
}

async function loadOpenAI() {
  const module = await import('openai');
  const OpenAI = module.default || module.OpenAI;

  if (!OpenAI) {
    throw new Error('OpenAI SDK not available');
  }

  return OpenAI;
}

function buildPrompt({ noticeText, teamInfo, documents }) {
  return [
    '다음 입력을 바탕으로 지원사업 신청 전 1차 체크리스트를 작성하세요.',
    '',
    '[공고문]',
    truncate(noticeText, 12000),
    '',
    '[팀 소개]',
    truncate(teamInfo, 5000),
    '',
    '[준비 서류 목록]',
    documents.length ? documents.map((document) => `- ${document}`).join('\n') : '- 없음',
    '',
    '작성 기준:',
    '- 최종 적격/부적격 판정을 하지 말고 "확인 필요", "보완 필요", "누락 가능"처럼 신중한 상태값을 사용하세요.',
    '- 제출 서류는 공고문 근거와 준비 목록의 매칭 여부를 나누어 정리하세요.',
    '- missingDocuments에는 준비 목록에 보이지 않는 필수 또는 필수 가능성이 높은 서류를 넣으세요.',
    '- improvementQuestions에는 팀이 답하면 체크 정확도가 좋아지는 질문을 넣으세요.',
    `- summary, risks, nextActions 중 최소 한 곳에는 다음 안전 문구 취지를 포함하세요: ${SAFETY_NOTICE}`
  ].join('\n');
}

function buildDemoAnalysis(input) {
  const requiredDocuments = buildRequiredDocuments(input.noticeText, input.documents);
  const missingDocuments = requiredDocuments
    .filter((document) => document.status !== '준비됨')
    .map((document) => ({
      name: document.name,
      reason: '준비 서류 목록에서 명확히 확인되지 않았습니다. 공고상 필수 여부 확인이 필요합니다.',
      priority: document.evidence.includes('자동 식별하지 못했습니다') ? '확인 필요' : '높음'
    }));

  const eligibility = buildEligibility(input.noticeText, input.teamInfo);
  const teamGaps = detectTeamInfoGaps(input.teamInfo);

  const analysis = {
    mode: 'demo',
    summary: [
      `공고문에서 ${requiredDocuments.length}개 서류 후보를 점검했고, 준비 목록 기준 ${missingDocuments.length}개 항목은 누락 가능성이 있습니다.`,
      '적격성은 자동 추정이 아니라 공고 원문과 담당 기관 기준으로 확인해야 합니다.',
      SAFETY_NOTICE
    ].join(' '),
    eligibility,
    requiredDocuments,
    missingDocuments,
    improvementQuestions: buildImprovementQuestions(missingDocuments, teamGaps),
    finalChecklist: buildFinalChecklist(eligibility, requiredDocuments),
    risks: [
      '데모 모드는 공고문 키워드와 서류명 매칭 기반이라 세부 예외 조건을 놓칠 수 있습니다.',
      missingDocuments.length
        ? '준비 서류 목록에 없는 필수 가능 서류가 있어 접수 전 제출 양식과 발급일 기준 확인이 필요합니다.'
        : '준비 서류가 일부 매칭되었더라도 최신 양식, 직인, 서명, 발급일 제한 확인이 필요합니다.',
      teamGaps.length
        ? `팀 소개에서 ${teamGaps.join(', ')} 정보가 부족하면 적격성 검토가 흔들릴 수 있습니다.`
        : '팀 소개에 포함된 정보도 증빙 서류와 일치하는지 확인이 필요합니다.',
      '개인정보와 고유식별정보는 원문 업로드와 제출 전 최소화 또는 마스킹이 필요합니다.'
    ],
    nextActions: [
      '공고문에서 지원대상, 제외대상, 제출서류, 접수마감 구간을 직접 표시해 재확인하세요.',
      missingDocuments.length
        ? `${missingDocuments.map((document) => document.name).join(', ')} 준비 여부를 먼저 확인하세요.`
        : '이미 준비된 서류도 공고의 최신 양식, 서명/날인, 발급일 기준에 맞는지 확인하세요.',
      '최종 제출 전 담당 기관 문의처 또는 FAQ로 애매한 자격 요건을 확인하세요.',
      '개인정보가 포함된 파일은 공유 범위와 보관 기간을 정하고 필요 최소한으로 제출하세요.'
    ]
  };

  return finalizeAnalysis(analysis, input);
}

function buildRequiredDocuments(noticeText, preparedDocuments) {
  const matches = DOCUMENT_HINTS.filter((hint) => includesAny(noticeText, hint.aliases));
  const inferredDocuments = matches.length
    ? matches
    : DOCUMENT_HINTS.slice(0, 4).map((hint) => ({
        ...hint,
        fallbackEvidence: '공고 내 제출서류 항목을 자동 식별하지 못했습니다. 기본 제출 후보로 확인이 필요합니다.'
      }));

  return inferredDocuments.map((hint) => {
    const prepared = isDocumentPrepared(hint, preparedDocuments);

    return {
      name: hint.name,
      status: prepared ? '준비됨' : '누락 가능',
      evidence: hint.fallbackEvidence || findEvidence(noticeText, hint.aliases),
      action: prepared
        ? '준비 목록에 보입니다. 공고 양식, 서명/날인, 발급일 기준을 확인하세요.'
        : '준비 목록에서 명확히 보이지 않습니다. 제출 대상인지 확인하고 필요 시 준비하세요.'
    };
  });
}

function buildEligibility(noticeText, teamInfo) {
  return ELIGIBILITY_HINTS.map((hint) => ({
    item: hint.item,
    status: '확인 필요',
    evidence: findEvidence(noticeText, hint.keywords),
    question: refineEligibilityQuestion(hint, teamInfo)
  }));
}

function refineEligibilityQuestion(hint, teamInfo) {
  const hasRelatedTeamInfo = includesAny(teamInfo, hint.keywords);

  if (hasRelatedTeamInfo) {
    return `${hint.question} 팀 소개에 관련 정보가 있으므로 증빙과 공고 기준의 일치 여부를 대조하세요.`;
  }

  return `${hint.question} 팀 소개에 해당 정보가 충분하지 않다면 보완 질문으로 확인하세요.`;
}

function buildImprovementQuestions(missingDocuments, teamGaps) {
  const questions = [
    '팀의 소재지, 설립일 또는 사업자등록일, 업력 기준일은 공고 기준과 어떻게 맞나요?',
    '대표자와 참여인력의 역할, 재직/참여 증빙, 중복 참여 제한은 확인되었나요?',
    '공고에서 요구하는 매출, 고용, 업종, 기술 분야 같은 정량/정성 기준을 증빙할 자료가 있나요?',
    '제출 마감 시각, 제출 채널, 파일명/용량/양식 제한을 누가 최종 확인하나요?'
  ];

  if (missingDocuments.length) {
    questions.unshift(
      `준비 목록에 보이지 않는 ${missingDocuments
        .slice(0, 3)
        .map((document) => document.name)
        .join(', ')}은 제출 대상인가요?`
    );
  }

  if (teamGaps.length) {
    questions.push(`팀 소개에 ${teamGaps.join(', ')} 정보를 보강할 수 있나요?`);
  }

  return questions;
}

function buildFinalChecklist(eligibility, requiredDocuments) {
  const eligibilityItems = eligibility.map((item) => ({
    item: item.item,
    status: '확인 필요',
    ownerHint: '대표/사업 담당자가 공고 원문과 증빙 기준을 대조'
  }));

  const documentItems = requiredDocuments.map((document) => ({
    item: document.name,
    status: document.status === '준비됨' ? '준비됨' : '확인 필요',
    ownerHint: document.status === '준비됨' ? '최신 양식과 서명/날인 확인' : '필수 제출 여부 확인 후 준비'
  }));

  return [
    ...eligibilityItems,
    ...documentItems,
    {
      item: '개인정보 최소화/마스킹',
      status: '확인 필요',
      ownerHint: '제출 전 주민번호, 연락처, 계좌번호 등 불필요한 정보 제거'
    },
    {
      item: '최종 기관 확인',
      status: '확인 필요',
      ownerHint: '담당 기관 문의처, FAQ, 공고 정정사항 확인'
    }
  ];
}

function finalizeAnalysis(candidate, input) {
  const fallback = {
    mode: 'demo',
    summary: SAFETY_NOTICE,
    eligibility: [],
    requiredDocuments: [],
    missingDocuments: [],
    improvementQuestions: [],
    finalChecklist: [],
    risks: [],
    nextActions: []
  };

  const analysis = {
    ...fallback,
    ...objectOrEmpty(candidate),
    mode: candidate?.mode === 'ai' ? 'ai' : 'demo',
    summary: toSafeText(candidate?.summary) || fallback.summary,
    eligibility: normalizeObjectArray(candidate?.eligibility, ['item', 'status', 'evidence', 'question']),
    requiredDocuments: normalizeObjectArray(candidate?.requiredDocuments, ['name', 'status', 'evidence', 'action']),
    missingDocuments: normalizeObjectArray(candidate?.missingDocuments, ['name', 'reason', 'priority']),
    improvementQuestions: normalizeStringArray(candidate?.improvementQuestions),
    finalChecklist: normalizeObjectArray(candidate?.finalChecklist, ['item', 'status', 'ownerHint']),
    risks: normalizeStringArray(candidate?.risks),
    nextActions: normalizeStringArray(candidate?.nextActions)
  };

  if (!analysis.requiredDocuments.length) {
    analysis.requiredDocuments = buildRequiredDocuments(input.noticeText, input.documents);
  }

  if (!analysis.eligibility.length) {
    analysis.eligibility = buildEligibility(input.noticeText, input.teamInfo);
  }

  analysis.summary = ensureSafetyText(softenDecisiveText(analysis.summary));
  analysis.eligibility = analysis.eligibility.map(softenStatusObject);
  analysis.requiredDocuments = analysis.requiredDocuments.map(softenStatusObject);
  analysis.finalChecklist = analysis.finalChecklist.map(softenStatusObject);
  analysis.risks = ensureArrayIncludes(
    analysis.risks.map(softenDecisiveText),
    '최종 지원 가능 여부는 이 도구가 단정하지 않으며 공고 원문과 담당 기관 확인이 필요합니다.'
  );
  analysis.nextActions = ensureArrayIncludes(
    analysis.nextActions.map(softenDecisiveText),
    '개인정보와 고유식별정보를 최소화 또는 마스킹한 뒤 최종 제출본을 점검하세요.'
  );

  return analysis;
}

function parseJsonFromResponse(response) {
  const text = extractResponseText(response);
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('Empty response');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No JSON object in response');
    }
    return JSON.parse(match[0]);
  }
}

function extractResponseText(response) {
  if (typeof response?.output_text === 'string') {
    return response.output_text;
  }

  const parts = [];
  for (const output of response?.output || []) {
    for (const content of output?.content || []) {
      if (typeof content?.text === 'string') {
        parts.push(content.text);
      }
    }
  }

  return parts.join('\n');
}

function normalizeDocumentsList(value) {
  if (Array.isArray(value)) {
    return value.map(toSafeText).filter(Boolean);
  }

  return toSafeText(value)
    .split(/\r?\n|,|;|ㆍ|•/)
    .map((item) => item.replace(/^[\s\d().\-*]+/, '').trim())
    .filter(Boolean);
}

function detectTeamInfoGaps(teamInfo) {
  const checks = [
    { label: '소재지', aliases: ['소재지', '주소', '본사', '사업장', '지역'] },
    { label: '설립일/업력', aliases: ['설립', '창업', '개업', '업력', '사업자등록일'] },
    { label: '업종/분야', aliases: ['업종', '분야', '서비스', '제품', '기술'] },
    { label: '인력/역할', aliases: ['대표', '팀원', '인력', '역할', '담당'] }
  ];

  return checks.filter((check) => !includesAny(teamInfo, check.aliases)).map((check) => check.label);
}

function isDocumentPrepared(hint, preparedDocuments) {
  const matchTerms = getPreparedDocumentTerms(hint);

  return preparedDocuments.some((document) => {
    const line = toSafeText(document);
    const documentName = line.split(':')[0] || line;
    const mentionsDocument = includesAny(documentName, matchTerms);
    const markedUnavailable = includesAny(line, [
      'missing',
      'not-for-demo',
      'not ready',
      '누락',
      '미보유',
      '미준비',
      '없음',
      '준비 필요',
      '데모 제외'
    ]);

    return mentionsDocument && !markedUnavailable;
  });
}

function getPreparedDocumentTerms(hint) {
  const genericAliases = new Set(['개인정보', '신청서', '계획서', '소개서', '확인서', '매출', '특허', '상표', '인증서']);
  return [hint.name, ...hint.aliases.filter((alias) => !genericAliases.has(alias))];
}

function includesAny(text, keywords) {
  const normalizedText = normalizeForMatch(text);
  return keywords.some((keyword) => normalizedText.includes(normalizeForMatch(keyword)));
}

function findEvidence(text, keywords) {
  const lines = toSafeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const matchedLine = lines.find((line) => includesAny(line, keywords));

  if (matchedLine) {
    return truncate(maskSensitiveText(matchedLine), 180);
  }

  return '공고 원문에서 관련 표현을 자동 식별하지 못했습니다. 원문 확인이 필요합니다.';
}

function normalizeObjectArray(value, expectedKeys) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return expectedKeys.reduce((accumulator, key, index) => {
          accumulator[key] = index === 0 ? item : '';
          return accumulator;
        }, {});
      }

      const object = objectOrEmpty(item);
      return expectedKeys.reduce((accumulator, key) => {
        accumulator[key] = toSafeText(object[key]);
        return accumulator;
      }, {});
    })
    .filter((item) => toSafeText(item[expectedKeys[0]]));
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => softenDecisiveText(toSafeText(item))).filter(Boolean);
}

function softenStatusObject(item) {
  const next = { ...item };

  if ('status' in next) {
    next.status = softenStatus(next.status);
  }

  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string' && key !== 'status') {
      next[key] = softenDecisiveText(value);
    }
  }

  return next;
}

function softenStatus(status) {
  const text = toSafeText(status);

  if (!text) {
    return '확인 필요';
  }

  if (/(최종|확정|적격|부적격|탈락|통과|지원 가능|지원 불가|불가능)/.test(text)) {
    return '확인 필요';
  }

  return text;
}

function softenDecisiveText(text) {
  return toSafeText(text)
    .replace(/최종 지원 가능/g, '지원 가능성 확인 필요')
    .replace(/지원 가능함/g, '지원 가능성 확인 필요')
    .replace(/지원 가능입니다/g, '지원 가능성 확인 필요입니다')
    .replace(/지원 불가/g, '지원 제한 가능성 확인 필요')
    .replace(/부적격/g, '제한 요건 확인 필요')
    .replace(/적격/g, '요건 충족 여부 확인 필요');
}

function ensureSafetyText(text) {
  const normalized = toSafeText(text);
  if (normalized.includes('개인정보') && normalized.includes('최종')) {
    return normalized;
  }

  return `${normalized} ${SAFETY_NOTICE}`.trim();
}

function ensureArrayIncludes(items, requiredText) {
  const normalizedItems = normalizeStringArray(items);

  if (normalizedItems.some((item) => item.includes(requiredText.slice(0, 12)))) {
    return normalizedItems;
  }

  return [...normalizedItems, requiredText];
}

function normalizeForMatch(value) {
  return toSafeText(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()[\]{}'"`.,:;·ㆍ•\-_/\\]/g, '');
}

function maskSensitiveText(value) {
  return toSafeText(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[phone]')
    .replace(/\b\d{6}-\d{7}\b/g, '[id]')
    .replace(/\b\d{2,6}-\d{2,6}-\d{2,8}\b/g, '[number]');
}

function truncate(value, maxLength) {
  const text = toSafeText(value);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function toSafeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export default {
  analyzeApplication
};
