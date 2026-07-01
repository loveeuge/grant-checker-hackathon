const state = {
  apiAvailable: false,
  keyConfigured: false,
  demoMode: false,
  lastError: "",
  announcements: [],
};

const localSample = {
  grantNotice: `2026년 초기창업패키지 모집 공고

지원대상: 공고일 기준 업력 3년 이내 창업기업 또는 예비창업팀. 본점 소재지가 서울 또는 수도권인 ICT, AI, 데이터 기반 서비스 기업을 우대합니다.
지원내용: 사업화 자금 최대 7천만원, 멘토링, 투자 연계 프로그램.
주요 자격요건: 중소기업기본법상 중소기업, 국세/지방세 체납이 없을 것, 동일 과제로 정부 지원금을 중복 수혜하지 않을 것.
제출서류: 사업계획서, 사업자등록증 또는 예비창업 확인서, 대표자 신분증, 개인정보 수집 이용 동의서, 국세 및 지방세 납세증명서, 최근 2개년 재무제표(해당 시), 견적서.
평가항목: 문제 정의, 시장성, 기술 차별성, 실행 역량, 자금 사용 계획.`,
  teamIntro: `GrantReady 팀은 서울 소재 예비창업팀입니다. 생성형 AI를 활용해 지원사업 공고문과 팀 정보를 대조하고, 제출 전 누락 서류와 보완 질문을 자동으로 정리하는 SaaS를 개발하고 있습니다.

대표자는 공공사업 운영 경험 5년, 개발자는 문서 자동화와 RAG 서비스 구현 경험이 있습니다. 아직 사업자등록 전이며, MVP는 해커톤 이후 6주 안에 베타 출시 예정입니다. 매출은 없고 파일럿 고객 3곳과 인터뷰를 진행했습니다.`,
  preparedDocuments: `사업계획서 초안
대표자 신분증 사본
개인정보 수집 이용 동의서
서비스 소개서
MVP 화면 캡처
고객 인터뷰 요약본`,
};

const localAnnouncementSamples = [
  {
    id: "sample-kstartup-officehour",
    source: "kstartup",
    sourceLabel: "K-Startup",
    title: "[무료] VC 투자 및 오픈이노베이션 1:1 멘토링, 7월 dcamp officehour",
    organization: "은행권청년창업재단",
    category: "멘토링ㆍ컨설팅ㆍ교육",
    region: "전국",
    target: "일반기업, 1인 창조기업",
    startupAge: "예비창업자, 1년미만, 3년미만, 7년미만",
    period: "2026-06-25 ~ 2026-07-09",
    daysLeft: 8,
    status: "모집중",
    url: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=178340",
    summary:
      "스타트업이 VC, 오픈이노베이션 파트너와 1:1로 만나 투자유치와 사업협력 가능성을 논의하는 멘토링 프로그램입니다.",
  },
  {
    id: "sample-bizinfo-scaleup",
    source: "bizinfo",
    sourceLabel: "기업마당",
    title: "중소기업 AI 전환 바우처 지원사업",
    organization: "중소벤처기업부",
    category: "기술ㆍ디지털 전환",
    region: "전국",
    target: "중소기업, 창업기업",
    startupAge: "",
    period: "2026-07-01 ~ 2026-07-31",
    daysLeft: 30,
    status: "확인 필요",
    url: "https://www.bizinfo.go.kr/",
    summary:
      "AI 솔루션 도입과 업무 자동화 실증을 준비하는 기업을 대상으로 컨설팅과 바우처 비용을 지원하는 가상 샘플 공고입니다.",
  },
];

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  renderIcons();
  checkAdminStatus();
});

function cacheElements() {
  const ids = [
    "api-status-pill",
    "key-status-pill",
    "mode-pill",
    "refresh-status-button",
    "server-status-text",
    "server-status-detail",
    "admin-key-status-text",
    "admin-key-status-detail",
    "admin-key-form",
    "api-key-input",
    "admin-token-input",
    "save-key-button",
    "admin-form-note",
    "notice-banner",
    "announcement-search-form",
    "announcement-keyword-input",
    "announcement-source-select",
    "announcement-region-select",
    "announcement-category-select",
    "announcement-target-select",
    "announcement-search-button",
    "announcement-summary",
    "announcement-results",
    "sample-button",
    "analyze-button",
    "notice-file-input",
    "notice-file-button",
    "notice-url-input",
    "notice-url-button",
    "notice-import-note",
    "team-file-input",
    "team-file-button",
    "team-import-note",
    "documents-file-input",
    "documents-file-button",
    "documents-import-note",
    "grant-notice",
    "team-intro",
    "prepared-documents",
    "results-content",
    "result-timestamp",
  ];

  ids.forEach((id) => {
    els[toCamel(id)] = document.getElementById(id);
  });
}

function bindEvents() {
  els.refreshStatusButton?.addEventListener("click", checkAdminStatus);
  els.adminKeyForm?.addEventListener("submit", saveAdminKey);
  els.announcementSearchForm?.addEventListener("submit", searchAnnouncements);
  els.announcementResults?.addEventListener("click", handleAnnouncementAction);
  els.sampleButton?.addEventListener("click", fillSample);
  els.analyzeButton?.addEventListener("click", analyzeInputs);
  els.noticeFileButton?.addEventListener("click", () => els.noticeFileInput.click());
  els.noticeFileInput?.addEventListener("change", importNoticeFile);
  els.noticeUrlButton?.addEventListener("click", importNoticeUrl);
  els.noticeUrlInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      importNoticeUrl();
    }
  });
  els.teamFileButton?.addEventListener("click", () => els.teamFileInput.click());
  els.teamFileInput?.addEventListener("change", importTeamFile);
  els.documentsFileButton?.addEventListener("click", () => els.documentsFileInput.click());
  els.documentsFileInput?.addEventListener("change", importPreparedDocumentFiles);
}

async function checkAdminStatus() {
  setButtonLoading(els.refreshStatusButton, true);
  setPill(els.apiStatusPill, "checking", "API 확인 중", "radio-tower");
  setPill(els.keyStatusPill, "muted", "Key 확인 중", "key-round");

  try {
    const data = await requestJson("/api/admin/status");
    const configured = Boolean(
      data.configured ?? data.hasKey ?? data.keyConfigured ?? data.openaiReady ?? data.ready,
    );

    state.apiAvailable = true;
    state.keyConfigured = configured;
    state.lastError = "";
    updateStatusViews();
    hideBanner();
  } catch (error) {
    state.apiAvailable = false;
    state.keyConfigured = false;
    state.lastError = cleanError(error);
    state.demoMode = true;
    updateStatusViews();
    showBanner(
      "warning",
      "백엔드 상태 확인에 실패했습니다. 발표 흐름은 데모 fallback mode로 계속 확인할 수 있습니다.",
    );
  } finally {
    setButtonLoading(els.refreshStatusButton, false);
    renderIcons();
  }
}

async function saveAdminKey(event) {
  event.preventDefault();

  const apiKey = els.apiKeyInput.value.trim();
  const adminToken = els.adminTokenInput.value.trim();
  if (!apiKey) {
    els.adminFormNote.textContent = "등록할 API key를 입력해 주세요.";
    els.apiKeyInput.focus();
    return;
  }

  setButtonLoading(els.saveKeyButton, true);
  els.adminFormNote.textContent = "서버에 key를 등록하는 중입니다.";

  try {
    await requestJson("/api/admin/key", {
      method: "POST",
      body: JSON.stringify({ apiKey, adminToken }),
    });

    els.apiKeyInput.value = "";
    state.apiAvailable = true;
    state.keyConfigured = true;
    state.demoMode = false;
    state.lastError = "";
    updateStatusViews();
    showBanner("info", "API key가 서버로 전송되었습니다. 브라우저 저장소에는 남기지 않았습니다.");
    els.adminFormNote.textContent = "등록 완료. 필요하면 상태를 새로고침해 확인하세요.";
  } catch (error) {
    state.apiAvailable = false;
    state.demoMode = true;
    state.lastError = cleanError(error);
    updateStatusViews();
    showBanner("error", `API key 등록에 실패했습니다. ${state.lastError}`);
    els.adminFormNote.textContent = "등록 실패. 서버 실행 상태와 endpoint를 확인해 주세요.";
  } finally {
    setButtonLoading(els.saveKeyButton, false);
    renderIcons();
  }
}

async function fillSample() {
  setButtonLoading(els.sampleButton, true);

  try {
    const data = await requestJson("/api/sample");
    const sample = normalizeSample(data);
    setInputs(sample);
    state.demoMode = Boolean(data.demo ?? data.fallback ?? false);
    updateStatusViews();
    showBanner(
      state.demoMode ? "warning" : "info",
      state.demoMode
        ? "서버가 데모 샘플을 반환했습니다. 실제 분석 전에 공고문과 팀 정보를 확인해 주세요."
        : "샘플 자료를 불러왔습니다. 바로 분석해도 좋고 일부 내용을 수정해도 됩니다.",
    );
  } catch (error) {
    setInputs(localSample);
    state.demoMode = true;
    state.lastError = cleanError(error);
    updateStatusViews();
    showBanner(
      "warning",
      "샘플 API를 사용할 수 없어 내장 데모 샘플을 채웠습니다. 백엔드가 준비되면 /api/sample 응답을 우선 사용합니다.",
    );
  } finally {
    setButtonLoading(els.sampleButton, false);
    renderIcons();
  }
}

async function searchAnnouncements(event) {
  event.preventDefault();

  const params = new URLSearchParams({
    keyword: els.announcementKeywordInput.value.trim(),
    source: els.announcementSourceSelect.value,
    region: els.announcementRegionSelect.value,
    category: els.announcementCategorySelect.value,
    target: els.announcementTargetSelect.value,
    recruitingOnly: "true",
    limit: "8",
  });

  setButtonLoading(els.announcementSearchButton, true);
  els.announcementSummary.textContent = "공고를 검색하는 중입니다.";
  renderAnnouncementLoading();

  try {
    const data = await requestJson(`/api/announcements/search?${params.toString()}`);
    state.announcements = Array.isArray(data.results) ? data.results : [];
    renderAnnouncementResults(data, false);
    showBanner("info", `${state.announcements.length}개 공고를 찾았습니다. 공고를 선택하면 검토 자료에 자동 입력됩니다.`);
  } catch (error) {
    const fallback = buildLocalAnnouncementSearch(params);
    state.announcements = fallback.results;
    renderAnnouncementResults(fallback, true);
    showBanner("warning", `공고 검색 API를 사용할 수 없어 샘플 공고를 표시했습니다. ${cleanError(error)}`);
  } finally {
    setButtonLoading(els.announcementSearchButton, false);
    renderIcons();
  }
}

function buildLocalAnnouncementSearch(params) {
  const keyword = String(params.get("keyword") || "").toLowerCase();
  const source = params.get("source") || "all";
  const region = params.get("region") || "";
  const category = params.get("category") || "";
  const target = params.get("target") || "";

  const results = localAnnouncementSamples
    .filter((item) => source === "all" || item.source === source)
    .filter((item) => !keyword || announcementSearchText(item).includes(keyword))
    .filter((item) => !region || announcementSearchText(item).includes(region.toLowerCase()) || item.region.includes("전국"))
    .filter((item) => !category || announcementSearchText(item).includes(category.toLowerCase()))
    .filter((item) => !target || announcementSearchText(item).includes(target.toLowerCase()))
    .map((item) => ({
      ...item,
      noticeText: announcementToNoticeText(item),
    }));

  return {
    ok: true,
    count: results.length,
    results,
    sources: [
      { source: "local", label: "샘플", status: "fallback", message: "샘플 공고를 표시했습니다." },
    ],
  };
}

function renderAnnouncementLoading() {
  els.announcementResults.innerHTML = `
    <div class="announcement-empty">
      <i data-lucide="loader-circle" aria-hidden="true"></i>
      <span>검색 중입니다.</span>
    </div>
  `;
  renderIcons();
}

function renderAnnouncementResults(data, isFallback) {
  const results = Array.isArray(data.results) ? data.results : [];
  const sourceText = summarizeAnnouncementSources(data.sources || []);
  els.announcementSummary.textContent = isFallback
    ? `샘플 공고 ${results.length}개를 표시했습니다. ${sourceText}`
    : `검색 결과 ${results.length}개. ${sourceText}`;

  if (!results.length) {
    els.announcementResults.innerHTML = `
      <div class="announcement-empty">
        <i data-lucide="search-x" aria-hidden="true"></i>
        <span>조건에 맞는 공고가 없습니다.</span>
      </div>
    `;
    renderIcons();
    return;
  }

  els.announcementResults.innerHTML = results.map(renderAnnouncementCard).join("");
  renderIcons();
}

function renderAnnouncementCard(item) {
  const daysLabel = formatDaysLeft(item.daysLeft);
  const sourceClass = item.source === "bizinfo" ? "is-bizinfo" : "is-kstartup";
  const url = escapeAttribute(item.url || "");

  return `
    <article class="announcement-card">
      <div class="announcement-card-head">
        <span class="source-chip ${sourceClass}">${escapeHtml(item.sourceLabel || item.source || "공고")}</span>
        <span class="deadline-chip">${escapeHtml(daysLabel)}</span>
      </div>
      <h3>${escapeHtml(item.title || "제목 없음")}</h3>
      <dl class="announcement-meta">
        ${renderMetaItem("기관", item.organization)}
        ${renderMetaItem("기간", item.period)}
        ${renderMetaItem("분야", item.category)}
        ${renderMetaItem("지역", item.region)}
        ${renderMetaItem("대상", item.target)}
      </dl>
      <p>${escapeHtml(truncateInline(item.summary || "공고 요약을 확인하세요.", 160))}</p>
      <div class="announcement-actions">
        <button class="button primary" type="button" data-announcement-action="use" data-announcement-id="${escapeAttribute(item.id)}">
          <i data-lucide="file-plus-2" aria-hidden="true"></i>
          이 공고로 분석하기
        </button>
        ${
          url
            ? `<a class="button ghost" href="${url}" target="_blank" rel="noreferrer">
                <i data-lucide="external-link" aria-hidden="true"></i>
                원문 보기
              </a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderMetaItem(label, value) {
  if (!value) return "";
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function handleAnnouncementAction(event) {
  const button = event.target.closest("[data-announcement-action='use']");
  if (!button) return;

  const item = state.announcements.find((announcement) => announcement.id === button.dataset.announcementId);
  if (!item) return;

  applyAnnouncementToNotice(item);
}

function applyAnnouncementToNotice(item) {
  const text = String(item.noticeText || announcementToNoticeText(item)).trim();
  els.grantNotice.value = text;
  els.noticeImportNote.textContent = `${item.sourceLabel || "검색"} 공고를 공고문 칸에 입력했습니다.`;
  showBanner("info", `${item.title} 공고를 검토 자료에 넣었습니다. 팀 소개와 준비 서류가 있으면 바로 분석할 수 있습니다.`);

  const values = getInputs();
  if (values.grantNotice && values.teamIntro && values.preparedDocuments) {
    analyzeInputs();
  }
}

async function analyzeInputs() {
  const values = getInputs();
  const filledCount = [values.grantNotice, values.teamIntro, values.preparedDocuments].filter(Boolean).length;

  if (filledCount < 3) {
    showBanner("error", "공고문, 팀 소개, 준비 서류를 모두 입력해 주세요. 준비 서류가 아직 없으면 '없음'이라고 적어도 됩니다.");
    return;
  }

  setButtonLoading(els.analyzeButton, true);
  setAnalyzingState();

  try {
    const data = await requestJson("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        noticeText: values.grantNotice,
        teamInfo: values.teamIntro,
        documentsList: values.preparedDocuments,
        grantNotice: values.grantNotice,
        teamIntro: values.teamIntro,
        preparedDocuments: values.preparedDocuments,
        notice: values.grantNotice,
        team: values.teamIntro,
        documents: values.preparedDocuments,
      }),
    });

    const normalized = normalizeAnalysis(data, Boolean(data.demo ?? data.fallback ?? data.mode === "demo"));
    state.apiAvailable = true;
    state.demoMode = normalized.demo;
    state.lastError = "";
    updateStatusViews();
    renderResults(normalized);
    showBanner(
      normalized.demo ? "warning" : "info",
      normalized.demo
        ? "서버가 demo fallback 결과를 반환했습니다. 실제 key 연결 전 발표용 흐름으로 확인하세요."
        : "분석이 완료되었습니다. 결과 표와 체크리스트를 발표 화면에서 바로 사용할 수 있습니다.",
    );
  } catch (error) {
    const normalized = buildFallbackAnalysis(values, cleanError(error));
    state.apiAvailable = false;
    state.demoMode = true;
    state.lastError = normalized.fallbackReason;
    updateStatusViews();
    renderResults(normalized);
    showBanner(
      "warning",
      "분석 API를 사용할 수 없어 demo fallback 결과를 생성했습니다. 백엔드 연결 후 같은 화면 구조로 실제 응답을 렌더링합니다.",
    );
  } finally {
    setButtonLoading(els.analyzeButton, false);
    renderIcons();
  }
}

async function importNoticeFile() {
  const file = els.noticeFileInput.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("noticeFile", file);

  setButtonLoading(els.noticeFileButton, true);
  els.noticeImportNote.textContent = `${file.name}에서 공고문을 추출하는 중입니다.`;

  try {
    const data = await requestJson("/api/import/notice/file", {
      method: "POST",
      body: formData,
    });

    applyImportedNotice(data, file.name);
  } catch (error) {
    showBanner("error", `파일을 불러오지 못했습니다. ${cleanError(error)}`);
    els.noticeImportNote.textContent = "사진이나 스캔 이미지는 관리자 화면에서 API key를 등록한 뒤 JPG, PNG, WEBP, GIF로 첨부해 주세요.";
  } finally {
    els.noticeFileInput.value = "";
    setButtonLoading(els.noticeFileButton, false);
    renderIcons();
  }
}

async function importNoticeUrl() {
  const url = els.noticeUrlInput.value.trim();
  if (!url) {
    els.noticeImportNote.textContent = "불러올 공고문 URL을 입력해 주세요.";
    els.noticeUrlInput.focus();
    return;
  }

  setButtonLoading(els.noticeUrlButton, true);
  els.noticeImportNote.textContent = "URL에서 공고문을 불러오는 중입니다.";

  try {
    const data = await requestJson("/api/import/notice/url", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    applyImportedNotice(data, url);
  } catch (error) {
    showBanner("error", `URL을 불러오지 못했습니다. ${cleanError(error)}`);
    els.noticeImportNote.textContent = "공개된 http/https 공고문 URL만 사용할 수 있습니다.";
  } finally {
    setButtonLoading(els.noticeUrlButton, false);
    renderIcons();
  }
}

function applyImportedNotice(data, label) {
  const text = String(data.text || "").trim();
  if (!text) {
    showBanner("error", "공고문 텍스트를 찾지 못했습니다.");
    return;
  }

  els.grantNotice.value = text;
  const source = data.source || {};
  const sourceLabel = source.kind ? source.kind.toUpperCase() : "파일";
  const truncatedText = source.truncated ? " 긴 문서는 앞부분만 반영했습니다." : "";
  els.noticeImportNote.textContent = `${sourceLabel} 공고문 ${text.length.toLocaleString("ko-KR")}자를 불러왔습니다.${truncatedText}`;
  showBanner("info", `${label} 공고문을 불러왔습니다. 팀 소개와 준비 서류가 있으면 바로 분석할 수 있습니다.`);

  const values = getInputs();
  if (values.grantNotice && values.teamIntro && values.preparedDocuments) {
    analyzeInputs();
  }
}

async function importTeamFile() {
  const file = els.teamFileInput.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("teamFile", file);

  setButtonLoading(els.teamFileButton, true);
  els.teamImportNote.textContent = `${file.name}에서 팀 소개를 추출하는 중입니다.`;

  try {
    const data = await requestJson("/api/import/team/file", {
      method: "POST",
      body: formData,
    });

    applyImportedTeam(data, file.name);
  } catch (error) {
    showBanner("error", `팀 소개 파일을 불러오지 못했습니다. ${cleanError(error)}`);
    els.teamImportNote.textContent = "사진이나 이미지 중심 파일은 관리자 화면에서 API key를 등록한 뒤 JPG, PNG, WEBP, GIF로 첨부해 주세요.";
  } finally {
    els.teamFileInput.value = "";
    setButtonLoading(els.teamFileButton, false);
    renderIcons();
  }
}

function applyImportedTeam(data, label) {
  const text = String(data.text || "").trim();
  if (!text) {
    showBanner("error", "팀 소개 텍스트를 찾지 못했습니다.");
    return;
  }

  els.teamIntro.value = text;
  const source = data.source || {};
  const sourceLabel = source.kind ? source.kind.toUpperCase() : "파일";
  const truncatedText = source.truncated ? " 긴 파일은 앞부분만 반영했습니다." : "";
  els.teamImportNote.textContent = `${sourceLabel} 팀 소개 ${text.length.toLocaleString("ko-KR")}자를 불러왔습니다.${truncatedText}`;
  showBanner("info", `${label} 팀 소개를 불러왔습니다. 공고문과 준비 서류가 있으면 바로 분석할 수 있습니다.`);

  const values = getInputs();
  if (values.grantNotice && values.teamIntro && values.preparedDocuments) {
    analyzeInputs();
  }
}

async function importPreparedDocumentFiles() {
  const files = Array.from(els.documentsFileInput.files || []);
  if (!files.length) return;

  const formData = new FormData();
  files.forEach((file) => formData.append("documentFiles", file));

  setButtonLoading(els.documentsFileButton, true);
  els.documentsImportNote.textContent = `${files.length}개 준비서류를 정리하는 중입니다.`;

  try {
    const data = await requestJson("/api/import/documents/files", {
      method: "POST",
      body: formData,
    });

    applyImportedPreparedDocuments(data, files.length);
  } catch (error) {
    showBanner("error", `준비서류를 불러오지 못했습니다. ${cleanError(error)}`);
    els.documentsImportNote.textContent = "여러 파일은 한 번에 12개, 각 파일은 12MB 이하로 첨부해 주세요. 사진 추출은 API key가 필요합니다.";
  } finally {
    els.documentsFileInput.value = "";
    setButtonLoading(els.documentsFileButton, false);
    renderIcons();
  }
}

function applyImportedPreparedDocuments(data, fileCount) {
  const text = String(data.text || "").trim();
  if (!text) {
    showBanner("error", "준비서류 목록을 만들지 못했습니다.");
    return;
  }

  const existing = els.preparedDocuments.value.trim();
  els.preparedDocuments.value = existing ? `${existing}\n\n${text}` : text;

  const extractedCount = Array.isArray(data.documents) ? data.documents.filter((document) => document.extracted).length : 0;
  els.documentsImportNote.textContent = `${fileCount}개 파일을 정리했습니다. 텍스트 추출 ${extractedCount}개, 파일명 기록 ${fileCount - extractedCount}개.`;
  showBanner("info", "첨부한 준비서류를 목록으로 정리했습니다. 공고문과 팀 소개가 있으면 바로 분석할 수 있습니다.");

  const values = getInputs();
  if (values.grantNotice && values.teamIntro && values.preparedDocuments) {
    analyzeInputs();
  }
}

async function requestJson(url, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? parseJson(text) : {};

  if (!response.ok) {
    const message = data.error || data.message || data.detail || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function normalizeSample(data) {
  const source = data.sample || data.data || data;
  return {
    grantNotice: sampleNoticeToText(
      source.noticeText ||
      source.grantNotice ||
      source.notice ||
      source.announcement ||
      source.grant ||
      localSample.grantNotice,
    ),
    teamIntro: sampleTeamToText(
      source.teamInfo ||
      source.teamIntro ||
      source.teamProfile ||
      source.team ||
      source.company ||
      source.teamDescription ||
      localSample.teamIntro,
    ),
    preparedDocuments: sampleDocumentsToText(
      source.documentsList ||
      source.preparedDocuments ||
      source.documents ||
      source.docs ||
      source.files ||
      localSample.preparedDocuments,
    ),
  };
}

function sampleNoticeToText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return localSample.grantNotice;

  const lines = [
    value.title,
    value.agency ? `기관: ${value.agency}` : "",
    value.type ? `유형: ${value.type}` : "",
    value.supportAmount ? `지원규모: ${value.supportAmount}` : "",
    value.projectPeriod ? `사업기간: ${value.projectPeriod}` : "",
    value.applicationPeriod
      ? `접수기간: ${value.applicationPeriod.open || ""} ~ ${value.applicationPeriod.close || ""} ${value.applicationPeriod.timezone || ""}`.trim()
      : "",
    listBlock("지원대상", value.targetApplicants),
    listBlock("제출서류", value.requiredSubmission),
    listBlock("자격 및 유의사항", value.eligibilityNotes),
    value.announcementText,
  ];

  return lines.filter(Boolean).join("\n\n");
}

function sampleTeamToText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return localSample.teamIntro;

  const memberLines = Array.isArray(value.members)
    ? value.members.map((member) => `${member.name || "팀원"}: ${member.role || ""} ${member.experience || ""}`.trim())
    : [];

  const lines = [
    value.teamName ? `팀명: ${value.teamName}` : "",
    value.status ? `상태: ${value.status}` : "",
    value.membersCount ? `구성원: ${value.membersCount}명` : "",
    value.projectTitle ? `프로젝트: ${value.projectTitle}` : "",
    value.problem ? `문제정의: ${value.problem}` : "",
    value.solution ? `해결방안: ${value.solution}` : "",
    value.otherGrantFunding ? `중복수혜: ${value.otherGrantFunding}` : "",
    value.privacyPlan ? `개인정보 계획: ${value.privacyPlan}` : "",
    value.humanReviewPlan ? `검수 계획: ${value.humanReviewPlan}` : "",
    listBlock("팀원", memberLines),
  ];

  return lines.filter(Boolean).join("\n\n");
}

function sampleDocumentsToText(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return localSample.preparedDocuments;

  return value
    .map((document) => {
      if (typeof document === "string") return document;
      const detail = [document.format, document.status, document.notes].filter(Boolean).join(" / ");
      return detail ? `${document.name}: ${detail}` : document.name;
    })
    .filter(Boolean)
    .join("\n");
}

function listBlock(title, items) {
  if (!Array.isArray(items) || !items.length) return "";
  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function normalizeAnalysis(data, demo) {
  const source = data.analysis || data.result || data.data || data;
  const isDemo = demo || source.mode === "demo";
  const summary = normalizeSummary(source);
  const eligibilityRows = normalizeRows(
    pickFirst(source, ["eligibility", "eligibilityChecks", "qualificationChecks", "qualifications", "requirements", "criteria"]),
    "eligibility",
  );
  const documentRows = normalizeRows(
    pickFirst(source, ["requiredDocuments", "documents", "documentChecks", "submissionDocuments", "documentGaps", "missingDocuments"]),
    "documents",
  );
  const questions = normalizeList(
    pickFirst(source, ["questions", "followUpQuestions", "improvementQuestions", "clarifyingQuestions", "补완Questions"]),
  );
  const checklist = normalizeList(
    pickFirst(source, ["checklist", "finalChecklist", "nextSteps", "actions", "todo"]),
  );

  return {
    demo: isDemo,
    summary,
    eligibilityRows,
    documentRows,
    questions,
    checklist,
    fallbackReason: source.fallbackReason || data.fallbackReason || "",
  };
}

function normalizeSummary(source) {
  const raw =
    source.summary ||
    source.overview ||
    source.possibility ||
    source.eligibilitySummary ||
    source.supportSummary ||
    source;

  if (typeof raw === "string") {
    return {
      verdict: source.verdict || source.status || "검토 필요",
      title: "지원 가능성 요약",
      body: raw,
      score: clampScore(source.score ?? source.possibilityScore ?? source.confidence),
      confidence: source.confidenceLabel || source.confidence || "중간",
      rationale: source.rationale || source.reason || "",
    };
  }

  return {
    verdict: raw.verdict || raw.status || raw.result || source.verdict || "검토 필요",
    title: raw.title || raw.headline || source.title || "지원 가능성 요약",
    body:
      raw.body ||
      raw.text ||
      raw.description ||
      raw.rationale ||
      source.rationale ||
      "분석 결과를 바탕으로 지원 가능성과 보완 지점을 정리했습니다.",
    score: clampScore(raw.score ?? raw.possibilityScore ?? raw.confidence ?? source.score ?? source.possibilityScore),
    confidence: raw.confidenceLabel || raw.confidence || source.confidence || "중간",
    rationale: raw.reason || raw.rationale || source.reason || "",
  };
}

function normalizeRows(value, type) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeRow(item, type, index));
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, item], index) => {
      if (typeof item === "object" && item !== null) {
        return normalizeRow({ item: key, ...item }, type, index);
      }
      return normalizeRow({ item: key, status: item }, type, index);
    });
  }

  return String(value)
    .split(/\n|,/)
    .filter(Boolean)
    .map((item, index) => normalizeRow(item, type, index));
}

function normalizeRow(item, type, index) {
  if (typeof item === "string") {
    return {
      item: item.trim(),
      status: type === "documents" ? "missing" : "unknown",
      evidence: type === "documents" ? "응답에 세부 근거가 없어 누락 후보로 표시했습니다." : "추가 확인이 필요합니다.",
      action: type === "documents" ? "제출 전 보유 여부를 확인하세요." : "공고문 원문과 팀 정보를 다시 대조하세요.",
    };
  }

  const label =
    item.item ||
    item.label ||
    item.name ||
    item.requirement ||
    item.criteria ||
    item.document ||
    item.title ||
    `항목 ${index + 1}`;

  return {
    item: String(label),
    status: normalizeStatus(
      item.status || item.result || item.state || item.check || item.missing || (type === "documents" && item.reason ? "missing" : ""),
    ),
    evidence:
      item.evidence ||
      item.reason ||
      item.detail ||
      item.current ||
      item.note ||
      item.description ||
      "근거 정보가 응답에 포함되지 않았습니다.",
    action:
      item.action ||
      item.recommendation ||
      item.nextStep ||
      item.question ||
      item.fix ||
      item.todo ||
      (type === "documents" ? "제출 전 서류명과 발급일을 확인하세요." : "필요 시 증빙을 보강하세요."),
  };
}

function normalizeStatus(status) {
  if (typeof status === "boolean") return status ? "pass" : "missing";

  const value = String(status || "unknown").toLowerCase();
  if (["unknown", "확인 필요", "확인필요", "검토 필요", "검토필요"].includes(value)) {
    return "unknown";
  }
  if (["no", "false"].includes(value)) {
    return "fail";
  }
  if (["fail", "failed", "ineligible", "불가", "미충족", "탈락"].some((word) => value.includes(word))) {
    return "fail";
  }
  if (["missing", "없음", "누락", "미제출"].some((word) => value.includes(word))) {
    return "missing";
  }
  if (["warn", "partial", "maybe", "risk", "주의", "부분", "보완"].some((word) => value.includes(word))) {
    return "warn";
  }
  if (
    ["pass", "passed", "ok", "eligible", "met", "yes", "true", "충족", "완료", "준비됨"].some((word) => value.includes(word)) ||
    value === "가능"
  ) {
    return "pass";
  }
  return "unknown";
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return { title: "", text: item };
      return {
        title: item.title || item.item || item.name || "",
        text: item.text || item.question || item.description || item.action || item.detail || item.ownerHint || item.reason || JSON.stringify(item),
      };
    });
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([title, text]) => ({ title, text: typeof text === "string" ? text : JSON.stringify(text) }));
  }
  return String(value)
    .split(/\n/)
    .map((text) => text.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)
    .map((text) => ({ title: "", text }));
}

function buildFallbackAnalysis(values, reason) {
  const combined = `${values.grantNotice}\n${values.teamIntro}\n${values.preparedDocuments}`;
  const notice = values.grantNotice;
  const team = values.teamIntro;
  const docs = values.preparedDocuments;
  const requiredDocs = detectRequiredDocuments(notice);
  const documentRows = requiredDocs.map((name) => {
    const hasDoc = containsAny(docs, docAliases(name));
    return {
      item: name,
      status: hasDoc ? "pass" : "missing",
      evidence: hasDoc ? "준비 서류 목록에서 확인되었습니다." : "현재 준비 서류 목록에서 직접 확인되지 않았습니다.",
      action: hasDoc ? "제출 양식과 발급일 기준만 재확인하세요." : "발급 가능 여부와 제출 양식을 먼저 확보하세요.",
    };
  });

  const eligibilityRows = [
    {
      item: "사업 분야 적합성",
      status: containsAny(combined, ["ai", "인공지능", "데이터", "ict", "소프트웨어", "saas", "자동화"]) ? "pass" : "warn",
      evidence: "공고문과 팀 소개의 핵심 키워드를 기준으로 대조했습니다.",
      action: "사업계획서 첫 장에 공고 우대 분야와 제품 설명을 같은 표현으로 맞추세요.",
    },
    {
      item: "기업 단계 및 업력",
      status: inferStageStatus(notice, team),
      evidence: "예비창업, 업력 3년 이내, 사업자등록 전후 표현을 확인했습니다.",
      action: "사업자등록일 또는 예비창업 상태를 증빙할 문구와 서류를 명확히 준비하세요.",
    },
    {
      item: "지역/대상 요건",
      status: inferRegionStatus(notice, team),
      evidence: "서울, 수도권, 지역 제한 키워드를 기준으로 비교했습니다.",
      action: "본점 소재지, 대표자 주소, 사업장 예정지를 공고 기준에 맞춰 확인하세요.",
    },
    {
      item: "체납/중복수혜 제외요건",
      status: "unknown",
      evidence: "팀 소개만으로 국세/지방세 체납과 동일 과제 중복수혜 여부는 확인할 수 없습니다.",
      action: "납세증명서와 최근 정부지원 수혜 이력을 제출 전 별도 점검하세요.",
    },
  ];

  const passCount = eligibilityRows.filter((row) => row.status === "pass").length;
  const missingDocs = documentRows.filter((row) => row.status === "missing").length;
  const score = Math.max(48, Math.min(88, Math.round(52 + passCount * 10 - missingDocs * 3)));

  return {
    demo: true,
    fallbackReason: reason,
    summary: {
      verdict: missingDocs > 2 ? "보완 후 지원 권장" : "지원 가능성 높음",
      title: "데모 기준 지원 가능성 요약",
      body:
        missingDocs > 2
          ? "핵심 자격은 대체로 맞아 보이지만 제출서류 누락 후보가 있어 접수 전 보완이 필요합니다."
          : "공고의 주요 대상 요건과 팀 소개가 비교적 잘 맞습니다. 제외요건 증빙과 서류 형식만 확정하면 지원 흐름이 매끄럽습니다.",
      score,
      confidence: "데모 추정",
      rationale: "API 연결 실패 시 브라우저에서 키워드 기반으로 생성한 발표용 예시 결과입니다.",
    },
    eligibilityRows,
    documentRows,
    questions: [
      { text: "사업자등록일 또는 예비창업 상태를 증빙할 수 있는 공식 문서가 있나요?" },
      { text: "동일 과제로 최근 3년 내 정부지원금을 받은 이력이 있나요?" },
      { text: "지원금 사용 계획을 공고 평가항목별로 금액과 산출근거까지 나눌 수 있나요?" },
      { text: "파일럿 고객 인터뷰나 협약 의향서를 제출 가능한 형태로 정리했나요?" },
    ],
    checklist: [
      { title: "공고 원문 표시", text: "지원대상, 제외요건, 제출서류, 평가항목을 사업계획서 목차 옆에 매핑하세요." },
      { title: "누락서류 발급", text: "납세증명서, 사업자등록 관련 서류, 견적서처럼 발급 시간이 필요한 항목을 먼저 처리하세요." },
      { title: "평가항목 보강", text: "문제 정의, 시장성, 기술 차별성, 실행 역량, 자금 사용 계획을 각각 한 문단씩 보강하세요." },
      { title: "제출 전 리허설", text: "파일명, 직인/서명, 발급일, PDF 병합 순서를 최종 접수 화면 기준으로 점검하세요." },
    ],
  };
}

function detectRequiredDocuments(notice) {
  const candidates = [
    "사업계획서",
    "사업자등록증",
    "예비창업 확인서",
    "대표자 신분증",
    "개인정보 수집 이용 동의서",
    "국세 및 지방세 납세증명서",
    "최근 2개년 재무제표",
    "견적서",
    "법인등기부등본",
    "4대보험 가입자 명부",
  ];

  const detected = candidates.filter((doc) => containsAny(notice, docAliases(doc)));
  return detected.length ? detected : candidates.slice(0, 7);
}

function docAliases(name) {
  const map = {
    "국세 및 지방세 납세증명서": ["국세", "지방세", "납세증명", "세금완납"],
    "최근 2개년 재무제표": ["재무제표", "손익계산서", "재무상태표"],
    "개인정보 수집 이용 동의서": ["개인정보", "동의서"],
    "4대보험 가입자 명부": ["4대보험", "가입자 명부"],
  };
  return [name, ...(map[name] || [])];
}

function inferStageStatus(notice, team) {
  const noticeWantsEarly = containsAny(notice, ["예비창업", "초기창업", "3년 이내", "업력 3년"]);
  const teamEarly = containsAny(team, ["예비창업", "사업자등록 전", "업력 3년", "초기창업", "mvp"]);
  if (!noticeWantsEarly) return "unknown";
  return teamEarly ? "pass" : "warn";
}

function inferRegionStatus(notice, team) {
  const regions = ["서울", "수도권", "경기", "인천", "부산", "대전", "대구", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  const noticeRegions = regions.filter((region) => notice.includes(region));
  if (!noticeRegions.length) return "unknown";
  return noticeRegions.some((region) => team.includes(region)) ? "pass" : "warn";
}

function renderResults(result) {
  const score = clampScore(result.summary.score);
  const eligibilityRows = result.eligibilityRows.length
    ? result.eligibilityRows
    : [{ item: "자격요건", status: "unknown", evidence: "응답에 체크표가 없습니다.", action: "백엔드 응답 필드명을 확인하세요." }];
  const documentRows = result.documentRows.length
    ? result.documentRows
    : [{ item: "제출서류", status: "unknown", evidence: "응답에 누락표가 없습니다.", action: "필수 제출서류 목록을 응답에 포함하세요." }];
  const questions = result.questions.length ? result.questions : [{ text: "추가 보완 질문이 응답에 포함되지 않았습니다." }];
  const checklist = result.checklist.length ? result.checklist : [{ title: "최종 확인", text: "제출 전 공고문 원문과 접수 화면 기준으로 다시 확인하세요." }];

  els.resultsContent.innerHTML = `
    <div class="result-layout">
      <div class="result-column">
        <section class="result-section" aria-labelledby="summary-heading">
          <div class="result-section-header">
            <h3 id="summary-heading">지원 가능성 요약</h3>
            <span class="section-count">${result.demo ? "Demo" : "Live"}</span>
          </div>
          <div class="result-section-body">
            <div class="summary-card">
              <div class="summary-topline">
                <span class="summary-verdict">${escapeHtml(result.summary.verdict)}</span>
                <h4 class="summary-title">${escapeHtml(result.summary.title)}</h4>
                <p class="summary-copy">${escapeHtml(result.summary.body)}</p>
              </div>
              <div class="summary-score">
                <div class="score-ring" style="--score-angle: ${score * 3.6}deg">${score}<span>%</span></div>
                <div class="score-copy">
                  <strong>검토 점수</strong>
                  <span>신뢰도: ${escapeHtml(String(result.summary.confidence || "중간"))}</span>
                </div>
              </div>
              <div class="summary-meta">
                <span class="meta-chip">자격 ${countByStatus(eligibilityRows, "pass")}/${eligibilityRows.length} 충족</span>
                <span class="meta-chip">누락 서류 ${countByStatus(documentRows, "missing") + countByStatus(documentRows, "fail")}건</span>
              </div>
              ${
                result.summary.rationale
                  ? `<p class="summary-copy">${escapeHtml(result.summary.rationale)}</p>`
                  : ""
              }
              ${
                result.demo && result.fallbackReason
                  ? `<div class="fallback-note">Fallback reason: ${escapeHtml(result.fallbackReason)}</div>`
                  : ""
              }
            </div>
          </div>
        </section>

        ${renderListSection("questions-heading", "보완 질문", questions, "message-square-warning")}
        ${renderChecklistSection("checklist-heading", "최종 체크리스트", checklist)}
      </div>

      <div class="result-column">
        ${renderTableSection("eligibility-heading", "자격요건 체크표", eligibilityRows, ["항목", "상태", "근거", "다음 조치"])}
        ${renderTableSection("documents-heading", "제출서류 누락표", documentRows, ["서류", "상태", "현재 확인", "보완 조치"])}
      </div>
    </div>
  `;

  els.resultTimestamp.textContent = `${new Date().toLocaleString("ko-KR")} 분석`;
  renderIcons();
}

function renderTableSection(id, title, rows, headers) {
  return `
    <section class="result-section" aria-labelledby="${id}">
      <div class="result-section-header">
        <h3 id="${id}">${title}</h3>
        <span class="section-count">${rows.length}개 항목</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${escapeHtml(row.item)}</td>
                    <td>${renderStatus(row.status)}</td>
                    <td>${escapeHtml(row.evidence)}</td>
                    <td>${escapeHtml(row.action)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderListSection(id, title, items, iconName) {
  return `
    <section class="result-section" aria-labelledby="${id}">
      <div class="result-section-header">
        <h3 id="${id}">${title}</h3>
        <span class="section-count">${items.length}개</span>
      </div>
      <div class="result-section-body">
        <ul class="question-list">
          ${items
            .map(
              (item) => `
                <li class="question-item">
                  <i data-lucide="${iconName}" aria-hidden="true"></i>
                  <p>${escapeHtml(item.text)}</p>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    </section>
  `;
}

function renderChecklistSection(id, title, items) {
  return `
    <section class="result-section" aria-labelledby="${id}">
      <div class="result-section-header">
        <h3 id="${id}">${title}</h3>
        <span class="section-count">${items.length}개</span>
      </div>
      <div class="result-section-body">
        <ul class="check-list">
          ${items
            .map(
              (item) => `
                <li class="check-item">
                  <i data-lucide="check-circle-2" aria-hidden="true"></i>
                  <p>${item.title ? `<strong>${escapeHtml(item.title)}</strong> ` : ""}${escapeHtml(item.text)}</p>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    </section>
  `;
}

function renderStatus(status) {
  const normalized = normalizeStatus(status);
  const config = {
    pass: ["status-pass", "circle-check", "충족"],
    warn: ["status-warn", "triangle-alert", "보완"],
    fail: ["status-fail", "circle-x", "미충족"],
    missing: ["status-missing", "file-x-2", "누락"],
    unknown: ["status-unknown", "circle-help", "확인 필요"],
    info: ["status-info", "info", "참고"],
  }[normalized] || ["status-unknown", "circle-help", "확인 필요"];

  return `<span class="table-status ${config[0]}"><i data-lucide="${config[1]}" aria-hidden="true"></i>${config[2]}</span>`;
}

function updateStatusViews() {
  if (state.apiAvailable) {
    if (els.serverStatusText) els.serverStatusText.textContent = "연결됨";
    if (els.serverStatusDetail) els.serverStatusDetail.textContent = "/api/admin/status 응답을 받았습니다.";
    setPill(els.apiStatusPill, "live", "API 연결됨", "radio-tower");
  } else {
    if (els.serverStatusText) els.serverStatusText.textContent = "데모 모드";
    if (els.serverStatusDetail) {
      els.serverStatusDetail.textContent = state.lastError ? `상태 확인 실패: ${state.lastError}` : "서버 응답이 없어 내장 데모로 동작합니다.";
    }
    setPill(els.apiStatusPill, "error", "API 미연결", "radio-tower");
  }

  if (state.keyConfigured) {
    if (els.adminKeyStatusText) els.adminKeyStatusText.textContent = "등록됨";
    if (els.adminKeyStatusDetail) els.adminKeyStatusDetail.textContent = "서버에 key가 설정되어 있습니다.";
    setPill(els.keyStatusPill, "live", "Key 등록됨", "key-round");
  } else {
    if (els.adminKeyStatusText) els.adminKeyStatusText.textContent = state.apiAvailable ? "미등록" : "확인 불가";
    if (els.adminKeyStatusDetail) {
      els.adminKeyStatusDetail.textContent = state.apiAvailable
        ? "서버는 연결됐지만 key 설정이 필요합니다."
        : "서버 연결 전에는 key 상태를 확인할 수 없습니다.";
    }
    setPill(els.keyStatusPill, state.apiAvailable ? "warning" : "muted", state.apiAvailable ? "Key 필요" : "Key 확인 불가", "key-round");
  }

  const shouldUseDemoMode = state.demoMode || !state.apiAvailable || !state.keyConfigured;
  setPill(
    els.modePill,
    shouldUseDemoMode ? "demo" : "live",
    shouldUseDemoMode ? "Demo fallback" : "Live mode",
    shouldUseDemoMode ? "flask-conical" : "activity",
  );
}

function setPill(element, variant, text, icon) {
  if (!element) return;
  element.className = `status-pill is-${variant}`;
  element.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i>${escapeHtml(text)}`;
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
}

function setAnalyzingState() {
  hideBanner();
  els.resultTimestamp.textContent = "분석 중입니다";
  els.resultsContent.innerHTML = `
    <div class="empty-state">
      <i data-lucide="loader-2" aria-hidden="true"></i>
      <h3>분석 결과를 정리하는 중입니다</h3>
      <p>자격요건, 서류 누락, 보완 질문과 최종 체크리스트를 한 화면으로 구성하고 있습니다.</p>
    </div>
  `;
  renderIcons();
}

function showBanner(type, message) {
  const icon = type === "error" ? "circle-alert" : type === "info" ? "info" : "triangle-alert";
  els.noticeBanner.className = `notice-banner is-${type}`;
  els.noticeBanner.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
  renderIcons();
}

function hideBanner() {
  els.noticeBanner.className = "notice-banner hidden";
  els.noticeBanner.textContent = "";
}

function getInputs() {
  return {
    grantNotice: els.grantNotice.value.trim(),
    teamIntro: els.teamIntro.value.trim(),
    preparedDocuments: els.preparedDocuments.value.trim(),
  };
}

function setInputs(sample) {
  els.grantNotice.value = sample.grantNotice || "";
  els.teamIntro.value = sample.teamIntro || "";
  els.preparedDocuments.value = sample.preparedDocuments || "";
}

function pickFirst(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) return source[key];
  }
  return null;
}

function clampScore(score) {
  const numeric = Number.parseFloat(score);
  if (Number.isNaN(numeric)) return 68;
  const normalized = numeric <= 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function countByStatus(rows, status) {
  return rows.filter((row) => normalizeStatus(row.status) === status).length;
}

function containsAny(text, words) {
  const lower = String(text || "").toLowerCase();
  return words.some((word) => lower.includes(String(word).toLowerCase()));
}

function summarizeAnnouncementSources(sources) {
  if (!Array.isArray(sources) || !sources.length) return "";
  return sources
    .map((source) => {
      const label = source.label || source.source || "출처";
      if (source.status === "skipped") return `${label}: 키 필요`;
      if (source.status === "fallback") return `${label}: 샘플`;
      if (source.ok) return `${label}: ${source.count || 0}건 조회`;
      return `${label}: 확인 필요`;
    })
    .join(" · ");
}

function formatDaysLeft(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "마감 확인";
  const days = Number(value);
  if (days < 0) return "마감 가능";
  if (days === 0) return "오늘 마감";
  return `D-${days}`;
}

function announcementToNoticeText(item) {
  return [
    `[공고 출처] ${item.sourceLabel || item.source || "공고 검색"}`,
    `공고명: ${item.title || ""}`,
    item.organization ? `기관: ${item.organization}` : "",
    item.category ? `지원분야: ${item.category}` : "",
    item.region ? `지원지역: ${item.region}` : "",
    item.target ? `신청대상: ${item.target}` : "",
    item.startupAge ? `창업기간: ${item.startupAge}` : "",
    item.period ? `접수기간: ${item.period}` : "",
    item.status ? `모집상태: ${item.status}` : "",
    item.summary ? `공고내용: ${item.summary}` : "",
    item.url ? `상세 URL: ${item.url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function announcementSearchText(item) {
  return [
    item.title,
    item.organization,
    item.category,
    item.region,
    item.target,
    item.startupAge,
    item.summary,
  ]
    .join(" ")
    .toLowerCase();
}

function truncateInline(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function cleanError(error) {
  const raw = String(error?.message || error || "알 수 없는 오류").replace(/^Error:\s*/, "");
  if (/<\/?[a-z][\s\S]*>/i.test(raw) || raw.includes("Unsupported method")) {
    return "서버 API endpoint가 아직 준비되지 않았거나 JSON 응답이 아닙니다.";
  }

  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

function toCamel(id) {
  return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
