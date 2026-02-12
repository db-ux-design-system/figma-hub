/**
 * Loading state component shown during long-running operations.
 */

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading icons...",
}: LoadingStateProps) {
  return (
    <div className="p-fix-md flex flex-col gap-fix-md items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-fix-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-sm text-center">⏳ {message}</p>
      </div>
    </div>
  );
}
