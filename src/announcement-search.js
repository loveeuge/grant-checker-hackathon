const DEFAULT_KSTARTUP_PROXY_BASE = 'https://k-skill-proxy.nomadamas.org';
const BIZINFO_API_BASE = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';
const DEFAULT_PER_SOURCE = 18;
const MAX_RESULTS = 12;
const REQUEST_TIMEOUT_MS = 12000;

export async function searchAnnouncements(filters = {}, env = process.env) {
  const query = normalizeSearchFilters(filters);
  const jobs = [];

  if (query.source === 'all' || query.source === 'kstartup') {
    jobs.push(fetchKstartupAnnouncements(query, env));
  }

  if (query.source === 'all' || query.source === 'bizinfo') {
    jobs.push(fetchBizinfoAnnouncements(query, env));
  }

  const settled = await Promise.allSettled(jobs);
  const sourceStatus = [];
  const rows = [];

  settled.forEach((result) => {
    if (result.status === 'fulfilled') {
      sourceStatus.push(result.value.status);
      rows.push(...result.value.rows);
    } else {
      sourceStatus.push({
        source: 'unknown',
        ok: false,
        status: 'error',
        message: '공고 검색 중 오류가 발생했습니다.'
      });
    }
  });

  const results = uniqueAnnouncements(rows)
    .filter((row) => matchesFilters(row, query))
    .sort(compareAnnouncements)
    .slice(0, query.limit)
    .map((row) => ({
      ...row,
      noticeText: buildAnnouncementNoticeText(row)
    }));

  return {
    ok: true,
    query,
    count: results.length,
    results,
    sources: sourceStatus
  };
}

export function normalizeSearchFilters(filters = {}) {
  const source = ['all', 'kstartup', 'bizinfo'].includes(String(filters.source || '').toLowerCase())
    ? String(filters.source || '').toLowerCase()
    : 'all';

  return {
    source,
    keyword: cleanText(filters.keyword || filters.q || '').slice(0, 80),
    region: cleanText(filters.region || ''),
    category: cleanText(filters.category || ''),
    target: cleanText(filters.target || ''),
    recruitingOnly: String(filters.recruitingOnly ?? filters.recruiting ?? 'true') !== 'false',
    limit: clampNumber(filters.limit, 1, MAX_RESULTS, 8),
    perSource: clampNumber(filters.perSource || filters.perPage, 5, 50, DEFAULT_PER_SOURCE)
  };
}

async function fetchKstartupAnnouncements(query, env) {
  const proxyBase = String(env.KSKILL_PROXY_BASE_URL || DEFAULT_KSTARTUP_PROXY_BASE).replace(/\/+$/, '');
  const pageCount = query.keyword ? 3 : 1;
  const rows = [];

  for (let page = 1; page <= pageCount; page += 1) {
    const url = new URL(`${proxyBase}/v1/kstartup/announcements`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('perPage', String(query.perSource));
    if (query.recruitingOnly) url.searchParams.set('rcrt_prgs_yn', 'Y');
    if (query.keyword) url.searchParams.set('biz_pbanc_nm', query.keyword);

    const data = await fetchJson(url);
    rows.push(...asArray(data?.data).map(normalizeKstartupAnnouncement).filter(Boolean));
  }

  return {
    status: {
      source: 'kstartup',
      label: 'K-Startup',
      ok: true,
      status: 'ok',
      count: rows.length,
      message: 'K-Startup 공고를 조회했습니다.'
    },
    rows
  };
}

async function fetchBizinfoAnnouncements(query, env) {
  const key = String(env.BIZINFO_API_KEY || env.BIZINFO_CRTFC_KEY || '').trim();
  if (!key) {
    return {
      status: {
        source: 'bizinfo',
        label: '기업마당',
        ok: false,
        status: 'skipped',
        count: 0,
        message: '기업마당 API key가 없어 건너뛰었습니다.'
      },
      rows: []
    };
  }

  const url = new URL(BIZINFO_API_BASE);
  url.searchParams.set('crtfcKey', key);
  url.searchParams.set('dataType', 'json');
  url.searchParams.set('pageUnit', String(query.perSource));
  url.searchParams.set('pageIndex', '1');
  if (query.keyword) url.searchParams.set('searchText', query.keyword);

  const data = await fetchJson(url);
  const items = pickBizinfoItems(data);
  const rows = items.map(normalizeBizinfoAnnouncement).filter(Boolean);

  return {
    status: {
      source: 'bizinfo',
      label: '기업마당',
      ok: true,
      status: 'ok',
      count: rows.length,
      message: '기업마당 공고를 조회했습니다.'
    },
    rows
  };
}

export function normalizeKstartupAnnouncement(item = {}) {
  const title = decodeText(item.biz_pbanc_nm || item.intg_pbanc_biz_nm || '');
  if (!title) return null;

  const startDate = parseCompactDate(item.pbanc_rcpt_bgng_dt);
  const endDate = parseCompactDate(item.pbanc_rcpt_end_dt);
  const url = cleanUrl(item.detl_pg_url || item.biz_gdnc_url || item.aply_mthd_onli_rcpt_istc);

  return finalizeAnnouncement({
    source: 'kstartup',
    sourceLabel: 'K-Startup',
    id: `kstartup-${item.pbanc_sn || item.id || stableKey(title)}`,
    title,
    organization: decodeText(item.pbanc_ntrp_nm || item.sprv_inst || item.biz_prch_dprt_nm || ''),
    category: decodeText(item.supt_biz_clsfc || ''),
    region: decodeText(item.supt_regin || ''),
    target: decodeText(item.aply_trgt || item.aply_trgt_ctnt || ''),
    startupAge: decodeText(item.biz_enyy || ''),
    age: decodeText(item.biz_trgt_age || ''),
    startDate,
    endDate,
    status: item.rcrt_prgs_yn === 'Y' ? '모집중' : '확인 필요',
    summary: decodeText(item.pbanc_ctnt || item.aply_trgt_ctnt || ''),
    exclusion: decodeText(item.aply_excl_trgt_ctnt || ''),
    applyMethod: decodeText(item.aply_mthd_onli_rcpt_istc || item.aply_mthd_eml_rcpt_istc || item.aply_mthd_etc_istc || ''),
    url,
    rawId: item.pbanc_sn || ''
  });
}

export function normalizeBizinfoAnnouncement(item = {}) {
  const title = decodeText(
    item.pblancNm ||
      item.pblancNmSj ||
      item.title ||
      item.bsnsNm ||
      item.bizPbancNm ||
      item.name ||
      ''
  );
  if (!title) return null;

  const period = decodeText(item.reqstBeginEndDe || item.reqstDe || item.period || '');
  const startDate = parseAnyDate(item.reqstBgnde || item.reqstBeginDe || firstDateFromText(period));
  const endDate = parseAnyDate(item.reqstEndde || item.reqstEndDe || lastDateFromText(period));
  const url = cleanUrl(item.pblancUrl || item.detlUrl || item.detailUrl || item.url || item.rceptEngnHmpgUrl || '');

  return finalizeAnnouncement({
    source: 'bizinfo',
    sourceLabel: '기업마당',
    id: `bizinfo-${item.pblancId || item.id || stableKey(`${title}-${period}`)}`,
    title,
    organization: decodeText(item.jrsdInsttNm || item.pblancInsttNm || item.insttNm || item.organization || ''),
    category: decodeText(item.pldirSportRealmLclasCodeNm || item.realmNm || item.supportField || item.category || ''),
    region: decodeText(item.areaNm || item.suptRegin || item.region || ''),
    target: decodeText(item.trgetNm || item.sptUsrTrgetNm || item.supportTarget || item.target || ''),
    startupAge: '',
    age: '',
    startDate,
    endDate,
    status: endDate && isBeforeToday(endDate) ? '마감 가능' : '확인 필요',
    summary: decodeText(item.bsnsSumryCn || item.bsnsCn || item.summary || item.content || ''),
    exclusion: '',
    applyMethod: decodeText(item.reqstMthPapersCn || item.reqstMthdCn || item.applyMethod || ''),
    url,
    rawId: item.pblancId || ''
  });
}

export function buildAnnouncementNoticeText(row = {}) {
  return [
    `[공고 출처] ${row.sourceLabel || row.source || '공고 검색'}`,
    `공고명: ${row.title || ''}`,
    row.organization ? `기관: ${row.organization}` : '',
    row.category ? `지원분야: ${row.category}` : '',
    row.region ? `지원지역: ${row.region}` : '',
    row.target ? `신청대상: ${row.target}` : '',
    row.startupAge ? `창업기간: ${row.startupAge}` : '',
    row.age ? `대상연령: ${row.age}` : '',
    row.period ? `접수기간: ${row.period}` : '',
    row.status ? `모집상태: ${row.status}` : '',
    row.summary ? `공고내용: ${truncateText(row.summary, 2200)}` : '',
    row.exclusion ? `제외대상/주의: ${truncateText(row.exclusion, 900)}` : '',
    row.applyMethod ? `신청방법: ${truncateText(row.applyMethod, 600)}` : '',
    row.url ? `상세 URL: ${row.url}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

function finalizeAnnouncement(row) {
  const period = buildPeriod(row.startDate, row.endDate);
  return {
    ...row,
    period,
    daysLeft: row.endDate ? daysFromToday(row.endDate) : null,
    searchable: [
      row.title,
      row.organization,
      row.category,
      row.region,
      row.target,
      row.startupAge,
      row.age,
      row.summary,
      row.exclusion,
      row.applyMethod
    ]
      .map((value) => cleanText(value).toLowerCase())
      .filter(Boolean)
      .join(' ')
  };
}

function matchesFilters(row, query) {
  if (!row) return false;
  if (query.recruitingOnly && row.endDate && isBeforeToday(row.endDate)) return false;

  const keywordTokens = splitTokens(query.keyword);
  if (keywordTokens.length && !keywordTokens.every((token) => row.searchable.includes(token.toLowerCase()))) return false;

  if (query.region && !matchesRegion(row.region, query.region) && !matchesToken(row.searchable, query.region)) return false;
  if (query.category && !matchesToken(row.category, query.category) && !matchesToken(row.searchable, query.category)) return false;
  if (query.target && !matchesToken(row.target, query.target) && !matchesToken(row.searchable, query.target)) return false;

  return true;
}

function compareAnnouncements(a, b) {
  const aDays = a.daysLeft ?? 99999;
  const bDays = b.daysLeft ?? 99999;
  if (aDays !== bDays) return aDays - bDays;
  if (a.source !== b.source) return a.source.localeCompare(b.source);
  return a.title.localeCompare(b.title, 'ko-KR');
}

function uniqueAnnouncements(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.source}:${row.rawId || row.url || row.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GrantReady-Announcement-Search/0.1'
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 160)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('JSON 응답을 받지 못했습니다.');
  }
}

function pickBizinfoItems(data) {
  const candidates = [
    data?.jsonArray,
    data?.jsonArray?.item,
    data?.response?.body?.items?.item,
    data?.response?.body?.items,
    data?.items?.item,
    data?.items,
    data?.data
  ];

  for (const candidate of candidates) {
    const values = asArray(candidate);
    if (values.length) return values;
  }

  return [];
}

function parseCompactDate(value) {
  const text = String(value || '').replace(/\D/g, '');
  if (text.length < 8) return '';
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function parseAnyDate(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{8}$/.test(text)) return parseCompactDate(text);

  const match = text.match(/(20\d{2})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})/);
  if (!match) return '';
  return [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-');
}

function firstDateFromText(value) {
  return String(value || '').match(/20\d{2}[.\-/년\s]*\d{1,2}[.\-/월\s]*\d{1,2}/)?.[0] || '';
}

function lastDateFromText(value) {
  const matches = String(value || '').match(/20\d{2}[.\-/년\s]*\d{1,2}[.\-/월\s]*\d{1,2}/g) || [];
  return matches.at(-1) || '';
}

function buildPeriod(startDate, endDate) {
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (endDate) return `~ ${endDate}`;
  if (startDate) return `${startDate} ~`;
  return '';
}

function daysFromToday(date) {
  const today = new Date();
  const kstToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const target = new Date(`${date}T00:00:00Z`);
  return Math.ceil((target.getTime() - kstToday.getTime()) / 86400000);
}

function isBeforeToday(date) {
  const days = daysFromToday(date);
  return Number.isFinite(days) && days < 0;
}

function cleanUrl(value) {
  const text = cleanText(value);
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(text)) return `https://${text}`;
  return text;
}

function decodeText(value) {
  return cleanText(value)
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function cleanText(value) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitTokens(value) {
  return cleanText(value)
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function matchesToken(value, token) {
  const normalizedValue = cleanText(value).toLowerCase();
  const normalizedToken = cleanText(token).toLowerCase();
  if (!normalizedToken) return true;
  return normalizedValue.includes(normalizedToken);
}

function matchesRegion(value, token) {
  const normalizedValue = normalizeRegion(value);
  const normalizedToken = normalizeRegion(token);
  if (!normalizedToken) return true;
  if (normalizedValue.includes('전국')) return true;
  return normalizedValue.includes(normalizedToken) || normalizedToken.includes(normalizedValue);
}

function normalizeRegion(value) {
  return cleanText(value)
    .replace(/특별자치시|특별자치도|특별시|광역시|자치도|자치시|도/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function stableKey(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function clampNumber(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function truncateText(value, maxLength) {
  const text = cleanText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
