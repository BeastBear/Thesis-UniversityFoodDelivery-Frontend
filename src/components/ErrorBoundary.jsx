import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
    }

    this.setState({
      error,
      errorInfo,
    });

    // Here you could send error to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <FaExclamationTriangle className="text-red-600 text-3xl" />
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is
              safe. Please try refreshing the page or return to home.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl text-left">
                <p className="text-xs font-bold text-red-900 mb-2">
                  Error Details (Dev Only):
                </p>
                <p className="text-xs text-red-700 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-2xl transition-colors">
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-lg"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                }}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
