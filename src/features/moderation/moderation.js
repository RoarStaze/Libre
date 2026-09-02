export function moderationQueueMarkup(state) {
  return `<section class="page"><div class="page-heading"><div><h1>Moderation queue</h1></div><p>Libre moderates conduct and abuse, not unconventionality itself. This local V1 shows the report-state architecture only.</p></div>${state.reports.length?state.reports.map((report)=>`<article class="library-item"><strong>${report.targetType}</strong><div>${report.reason}</div><small>${report.status}</small></article>`).join(''):'<div class="empty-state"><div><h2>No open reports</h2></div></div>'}</section>`;
}
