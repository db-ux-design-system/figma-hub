import type { MigrationReport } from "../types";

export function formatReport(report: MigrationReport): string {
  const lines: string[] = [
    `Migrations-Report: ${report.migrationTitle}`,
    `Release: ${report.releaseVersion}`,
    `Scope: ${report.scope}`,
    `Zeitpunkt: ${report.timestamp}`,
    "",
    "Zusammenfassung:",
    `  Gesamt:       ${report.summary.total}`,
    `  Erfolgreich:  ${report.summary.success}`,
    `  Fehlgeschlagen: ${report.summary.error}`,
    `  Übersprungen: ${report.summary.skipped}`,
  ];

  const failed = report.results.filter((r) => r.status === "error");
  if (failed.length > 0) {
    lines.push("", "Fehlgeschlagene Nodes:");
    for (const r of failed) {
      lines.push(
        `  - ${r.nodeId}: ${r.description}${r.error ? ` (${r.error})` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

export function downloadReport(report: MigrationReport): void {
  const text = formatReport(report);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `migration-report-${report.migrationId}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
