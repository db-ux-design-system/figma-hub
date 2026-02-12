/**
 * Error Boundary component to catch and handle React errors gracefully.
 * Prevents the entire app from crashing when an error occurs.
 */

import { Component, ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches errors in child components.
 *
 * @example
 * ```typescript
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error("❌ Error Boundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-fix-lg flex flex-col items-center justify-center h-screen gap-fix-md">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-fix-sm">
              ⚠️ Something went wrong
            </h2>
            <p className="text-sm text-gray-600 mb-fix-md">
              An unexpected error occurred. Please try refreshing the plugin.
            </p>
            {this.state.error && (
              <details className="text-left text-xs bg-gray-100 p-fix-sm rounded mb-fix-md">
                <summary className="cursor-pointer font-semibold mb-fix-xs">
                  Error Details
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="px-fix-md py-fix-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback component.
 * Can be used as a custom fallback for ErrorBoundary.
 */
export function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="p-fix-lg flex flex-col items-center justify-center h-screen">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-fix-sm">⚠️ Error</h2>
        <p className="text-sm text-gray-600 mb-fix-md">
          {error?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-fix-md py-fix-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload Plugin
        </button>
      </div>
    </div>
  );
}
