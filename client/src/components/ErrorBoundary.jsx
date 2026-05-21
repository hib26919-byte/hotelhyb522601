import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error("Application error", error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <span className="eyebrow">Something slipped out of place</span>
          <h1>Bael Tree Hotels hit an unexpected issue.</h1>
          <p>
            Please return to the home page and try again. If this continues, review
            your environment configuration and Firebase setup.
          </p>
          <button type="button" className="btn btn-gold" onClick={this.handleReset}>
            Return Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

