/**
 * Loading state component shown while icons are being scanned.
 */

export function LoadingState() {
  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      <p className="text-sm p-4">
        ⏳ Loading icons... (Waiting for scan results)
      </p>
    </div>
  );
}
