interface ProgressIndicatorProps {
  label: string;
  current: number;
  total?: number;
}

const ProgressIndicator = ({
  label,
  current,
  total,
}: ProgressIndicatorProps) => {
  const text = total
    ? `${label}: ${current} / ${total}`
    : `${label}: ${current}`;
  const pct =
    total && total > 0 ? Math.round((current / total) * 100) : undefined;

  return (
    <div className="flex flex-col gap-fix-xs">
      <span className="text-sm">{text}</span>
      {pct !== undefined && (
        <div className="h-2 w-full rounded bg-neutral-200">
          <div
            className="h-2 rounded bg-current transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
