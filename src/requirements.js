const COMMON_DOCUMENTS = [
  {
    name: '지원신청서',
    aliases: ['지원신청서', '참가신청서', '신청서', '온라인 신청서'],
    reason: '공고 신청 절차에서 기본 신청 양식 확인이 필요합니다.'
  },
  {
    name: '사업계획서',
    aliases: ['사업계획서', '수행계획서', '사업 수행계획서', '제안서', '계획서'],
    reason: '사업 내용, 예산, 실행계획을 설명하는 핵심 제출서류입니다.'
  },
  {
    name: '회사소개서/IR 자료',
    aliases: ['회사소개서', '기업 소개', '팀 소개', 'IR', '피치덱', '발표자료'],
    reason: '팀 역량과 제품/서비스를 설명하는 보완 자료입니다.'
  },
  {
    name: '사업자등록증',
    aliases: ['사업자등록증', '사업자 등록증', '사업자등록', '고유번호증'],
    reason: '기업 여부와 소재지, 업력 확인에 필요할 수 있습니다.'
  },
  {
    name: '예비창업 확인 자료',
    aliases: ['예비창업', '예비 창업', '사업자등록 전', '창업 예정'],
    reason: '예비창업자 대상 공고라면 사업자등록 전 상태를 설명해야 합니다.'
  },
  {
    name: '대표자 신분증',
    aliases: ['대표자 신분증', '신분증', '주민등록증', '운전면허증'],
    reason: '대표자 본인 확인 서류로 요구될 수 있습니다.'
  },
  {
    name: '개인정보 수집·이용 동의서',
    aliases: ['개인정보', '개인정보 수집', '개인정보 이용', '개인정보 동의서', '수집·이용 동의서'],
    reason: '지원사업 접수와 평가 과정에서 개인정보 처리 동의가 필요할 수 있습니다.'
  },
  {
    name: '참여확약서/서약서',
    aliases: ['확약서', '서약서', '참여확약서', '성실이행', '동의 확약'],
    reason: '사업 참여 조건과 의무 이행을 확인하는 서류입니다.'
  },
  {
    name: '국세/지방세 납세증명서',
    aliases: ['국세', '지방세', '납세증명서', '완납증명서', '체납'],
    reason: '체납 여부는 기업지원 공고의 대표적인 제외요건입니다.'
  },
  {
    name: '재무제표/매출 증빙',
    aliases: ['재무제표', '매출', '손익계산서', '부가가치세', '표준재무제표'],
    reason: '매출, 성장성, 기업 규모 확인에 필요할 수 있습니다.'
  },
  {
    name: '견적서/비교견적서',
    aliases: ['견적서', '비교견적', '산출내역', '예산 산출'],
    reason: '지원금 사용 계획과 예산 타당성을 확인하는 자료입니다.'
  },
  {
    name: '지식재산권/인증/수상 증빙',
    aliases: ['특허', '상표', '지식재산', '인증서', '수상', '실적 증빙'],
    reason: '기술성, 차별성, 실적을 강화하는 증빙 자료입니다.'
  }
];

const ELIGIBILITY_HINTS = [
  {
    item: '신청 대상',
    labels: ['신청대상', '지원대상', '대상기업', '신청자격'],
    question: '팀/회사가 공고의 신청 대상 유형에 해당하는지 확인하세요.'
  },
  {
    item: '지원 지역',
    labels: ['지원지역', '소재지', '본점', '사업장', '지역'],
    question: '본점, 지점, 사업장 소재지 기준이 공고와 맞는지 확인하세요.'
  },
  {
    item: '창업 기간/업력',
    labels: ['창업기간', '업력', '창업', '설립', '사업자등록일'],
    question: '사업자등록일 또는 설립일 기준으로 업력을 계산하세요.'
  },
  {
    item: '제외 요건',
    labels: ['제외대상', '제외', '체납', '참여제한', '중복지원', '휴업', '폐업'],
    question: '체납, 제재, 중복지원, 휴폐업 등 제외 사유가 없는지 확인하세요.'
  },
  {
    item: '접수 기간',
    labels: ['접수기간', '마감', '신청기간', '접수마감'],
    question: '마감일과 마감 시각, 제출 채널을 확인하세요.'
  }
];

const SELECTION_SIGNALS = [
  {
    item: '문제 정의와 필요성',
    keywords: ['문제 정의', '필요성', '시장성', '고객', '수요'],
    action: '고객 문제와 시장 근거를 숫자 또는 인터뷰 근거로 보강하세요.'
  },
  {
    item: '기술/서비스 차별성',
    keywords: ['기술', '차별성', 'AI', '데이터', '혁신', '특허'],
    action: '경쟁 서비스와 다른 점, 기술 구현 가능성, 보유 역량을 분명히 적으세요.'
  },
  {
    item: '실행 역량',
    keywords: ['실행 역량', '팀 역량', '대표자', '인력', '경험', '멘토링'],
    action: '대표자와 팀원의 관련 경험, 역할, 실적을 연결해 보여주세요.'
  },
  {
    item: '사업화/매출 가능성',
    keywords: ['사업화', '매출', '수익', '판로', '투자', '글로벌'],
    action: '파일럿, 고객 인터뷰, 판매 계획, 투자/판로 계획을 구체화하세요.'
  },
  {
    item: '자금 사용 계획',
    keywords: ['자금', '예산', '지원금', '견적', '산출'],
    action: '지원금 사용 항목별 산출 근거와 견적서를 준비하세요.'
  }
];

export async function extractRequirements({ noticeText = '', teamInfo = '' } = {}) {
  const notice = cleanText(noticeText);
  const team = cleanText(teamInfo);

  if (!notice) {
    throw new Error('공고문을 먼저 선택하거나 입력해 주세요.');
  }

  const documents = buildRequiredDocuments(notice);
  const eligibility = buildEligibilityRequirements(notice, team);
  const signals = buildSelectionSignals(notice, team);

  return {
    ok: true,
    mode: 'rules',
    requiredDocuments: documents,
    eligibilityRequirements: eligibility,
    selectionSignals: signals,
    applyUrl: extractApplyUrl(notice),
    summary: {
      documentCount: documents.length,
      eligibilityCount: eligibility.length,
      signalCount: signals.length
    }
  };
}

export function buildRequiredDocuments(noticeText = '') {
  const notice = cleanText(noticeText);
  const found = [];

  for (const hint of COMMON_DOCUMENTS) {
    if (hint.aliases.some((alias) => includesLoose(notice, alias))) {
      found.push(toRequiredDocument(hint, '공고문에서 관련 표현을 찾았습니다.'));
    }
  }

  const extractedNames = extractDocumentNamesFromNotice(notice);
  for (const name of extractedNames) {
    if (!found.some((document) => sameDocumentName(document.name, name))) {
      found.push(
        toRequiredDocument(
          {
            name,
            aliases: [name],
            reason: '공고의 제출서류 문장 또는 목록에서 추출한 항목입니다.'
          },
          '제출서류 목록에서 추출했습니다.'
        )
      );
    }
  }

  if (found.length < 3) {
    addIfMissing(found, '지원신청서', '공식 신청 화면 또는 첨부 양식 확인이 필요합니다.');
    addIfMissing(found, '사업계획서', '사업 내용과 실행 계획을 정리하는 기본 서류입니다.');
  }

  return found.slice(0, 10).map((document, index) => ({
    ...document,
    id: `doc-${index + 1}-${slugify(document.name)}`,
    status: '미첨부'
  }));
}

function buildEligibilityRequirements(notice, team) {
  const rows = [];

  for (const hint of ELIGIBILITY_HINTS) {
    const evidence = findLabeledEvidence(notice, hint.labels);
    if (evidence || hint.labels.some((label) => includesLoose(notice, label))) {
      rows.push({
        item: hint.item,
        status: inferEligibilityStatus(evidence, team),
        evidence: evidence || '공고문에서 관련 조건이 언급되었습니다.',
        question: hint.question
      });
    }
  }

  if (!rows.length) {
    rows.push(
      {
        item: '신청 대상',
        status: '확인 필요',
        evidence: '공고 선택 후 신청 대상 조건을 확인해야 합니다.',
        question: '우리 회사가 신청 대상 유형에 해당하는지 확인하세요.'
      },
      {
        item: '접수 기간',
        status: '확인 필요',
        evidence: findLabeledEvidence(notice, ['접수기간']) || '마감일 확인이 필요합니다.',
        question: '공식 공고 페이지에서 마감일과 제출 채널을 확인하세요.'
      }
    );
  }

  return rows.slice(0, 6);
}

function buildSelectionSignals(notice, team) {
  return SELECTION_SIGNALS.filter((signal) =>
    signal.keywords.some((keyword) => includesLoose(notice, keyword) || includesLoose(team, keyword))
  )
    .slice(0, 5)
    .map((signal) => ({
      ...signal,
      status: includesLoose(team, signal.keywords[0]) ? '강점 가능' : '보완 필요'
    }));
}

function extractDocumentNamesFromNotice(notice) {
  const targets = [];
  const lines = notice
    .split(/\n|(?=제출서류|구비서류|첨부서류|필수서류)/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!/(제출서류|구비서류|첨부서류|필수서류|준비서류)/.test(line)) continue;
    const compact = line.replace(/^[^:：]*[:：]/, '');
    compact
      .split(/[,，ㆍ·/]| 및 | 또는 |,|\n/)
      .map((part) => cleanText(part).replace(/^[-*0-9.\s]+/, ''))
      .filter((part) => part.length >= 3 && part.length <= 35)
      .forEach((part) => targets.push(part));
  }

  return [...new Set(targets)].filter((name) => /(서|증|계획|신청|동의|확인|등록|견적|자료|소개|IR)/.test(name));
}

function toRequiredDocument(hint, evidence) {
  return {
    name: hint.name,
    requiredLevel: '필수 또는 확인 필요',
    reason: hint.reason,
    evidence
  };
}

function addIfMissing(rows, name, reason) {
  if (rows.some((row) => sameDocumentName(row.name, name))) return;
  rows.push(
    toRequiredDocument(
      {
        name,
        aliases: [name],
        reason
      },
      '일반적인 지원사업 제출 흐름 기준으로 추가했습니다.'
    )
  );
}

function inferEligibilityStatus(evidence, team) {
  if (!team) return '회사소개 필요';
  const normalizedTeam = team.toLowerCase();
  const normalizedEvidence = String(evidence || '').toLowerCase();
  if (!normalizedEvidence) return '확인 필요';

  if (
    (normalizedEvidence.includes('예비창업') && normalizedTeam.includes('예비창업')) ||
    (normalizedEvidence.includes('서울') && normalizedTeam.includes('서울')) ||
    (normalizedEvidence.includes('ai') && normalizedTeam.includes('ai'))
  ) {
    return '적합 가능';
  }

  return '확인 필요';
}

function findLabeledEvidence(text, labels) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  for (const label of labels) {
    const match = lines.find((line) => includesLoose(line, label));
    if (match) return match.slice(0, 220);
  }
  return '';
}

function extractApplyUrl(text) {
  const match = String(text || '').match(/https?:\/\/[^\s)]+/);
  return match?.[0] || '';
}

function sameDocumentName(a, b) {
  const normalize = (value) => cleanText(value).replace(/[^a-z0-9가-힣]/gi, '').toLowerCase();
  const left = normalize(a);
  const right = normalize(b);
  return left.includes(right) || right.includes(left);
}

function includesLoose(text, keyword) {
  return cleanText(text).toLowerCase().includes(cleanText(keyword).toLowerCase());
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

function cleanText(value) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
