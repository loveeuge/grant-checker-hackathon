export function normalizeSamplePayload(sample = {}) {
  const noticeText = sampleNoticeToText(sample.noticeText ?? sample.grantNotice ?? sample.notice ?? sample.announcement);
  const teamInfo = sampleTeamToText(sample.teamInfo ?? sample.teamProfile ?? sample.team ?? sample.company);
  const documentsList = sampleDocumentsToText(sample.documentsList ?? sample.preparedDocuments ?? sample.documents ?? sample.docs);

  return {
    ...sample,
    noticeText,
    teamInfo,
    documentsList
  };
}

function sampleNoticeToText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  return [
    value.title,
    value.agency ? `기관: ${value.agency}` : '',
    value.type ? `유형: ${value.type}` : '',
    value.supportAmount ? `지원규모: ${value.supportAmount}` : '',
    value.projectPeriod ? `사업기간: ${value.projectPeriod}` : '',
    value.applicationPeriod
      ? `접수기간: ${value.applicationPeriod.open || ''} ~ ${value.applicationPeriod.close || ''} ${value.applicationPeriod.timezone || ''}`.trim()
      : '',
    listBlock('지원대상', value.targetApplicants),
    listBlock('제출서류', value.requiredSubmission),
    listBlock('자격 및 유의사항', value.eligibilityNotes),
    value.announcementText
  ]
    .filter(Boolean)
    .join('\n\n');
}

function sampleTeamToText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  const memberLines = Array.isArray(value.members)
    ? value.members.map((member) => `${member.name || '팀원'}: ${member.role || ''} ${member.experience || ''}`.trim())
    : [];

  return [
    value.teamName ? `팀명: ${value.teamName}` : '',
    value.status ? `상태: ${value.status}` : '',
    value.membersCount ? `구성원: ${value.membersCount}명` : '',
    value.projectTitle ? `프로젝트: ${value.projectTitle}` : '',
    value.problem ? `문제정의: ${value.problem}` : '',
    value.solution ? `해결방안: ${value.solution}` : '',
    value.otherGrantFunding ? `중복수혜: ${value.otherGrantFunding}` : '',
    value.privacyPlan ? `개인정보 계획: ${value.privacyPlan}` : '',
    value.humanReviewPlan ? `검수 계획: ${value.humanReviewPlan}` : '',
    listBlock('팀원', memberLines)
  ]
    .filter(Boolean)
    .join('\n\n');
}

function sampleDocumentsToText(value) {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';

  return value
    .map((document) => {
      if (typeof document === 'string') return document;
      const detail = [document.format, document.status, document.notes].filter(Boolean).join(' / ');
      return detail ? `${document.name}: ${detail}` : document.name;
    })
    .filter(Boolean)
    .join('\n');
}

function listBlock(title, items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}
