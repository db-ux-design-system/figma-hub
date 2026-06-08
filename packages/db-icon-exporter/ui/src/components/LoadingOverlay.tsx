/**
 * Loading overlay component shown as backdrop during operations.
 * Allows the user to see the underlying content while showing loading state.
 */

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p
          style={{
            fontSize: "14px",
            textAlign: "center",
            fontWeight: 500,
            color: "white",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
