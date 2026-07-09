import { DBButton, DBCard, DBInfotext } from "@db-ux/react-core-components";
import type { MigrationReport as MigrationReportType } from "../types";
import { downloadReport } from "../utils/report-export";

interface MigrationReportProps {
  report: MigrationReportType;
  onNavigateToNode?: (nodeId: string) => void;
}

const MigrationReportView = ({
  report,
  onNavigateToNode,
}: MigrationReportProps) => {
  const { summary, results } = report;
  const failed = results.filter((r) => r.status === "error");

  return (
    <div className="flex flex-col gap-fix-sm">
      <span className="font-bold">Migration Report</span>

      <div className="flex gap-fix-md text-sm">
        <span>Successful: {summary.success}</span>
        <span>Failed: {summary.error}</span>
        <span>Skipped: {summary.skipped}</span>
      </div>

      {failed.length > 0 && (
        <div className="flex flex-col gap-fix-xs">
          <DBInfotext semantic="critical">
            {failed.length} node(s) failed
          </DBInfotext>
          {failed.map((r) => (
            <DBCard
              key={r.nodeId}
              data-density="functional"
              className="gap-fix-xs cursor-pointer"
              onClick={() => onNavigateToNode?.(r.nodeId)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{r.nodeId}</span>
                {onNavigateToNode && (
                  <span className="text-xs underline">Go to instance →</span>
                )}
              </div>
              <span className="text-sm">{r.description}</span>
              {r.error && (
                <span className="text-xs text-red-600">{r.error}</span>
              )}
            </DBCard>
          ))}
        </div>
      )}

      {summary.error === 0 && (
        <DBInfotext semantic="successful">
          All nodes migrated successfully.
        </DBInfotext>
      )}

      <DBButton
        size="small"
        variant="outlined"
        onClick={() => downloadReport(report)}
      >
        Export report
      </DBButton>
    </div>
  );
};

export default MigrationReportView;
