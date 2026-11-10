import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FaceWindowApp } from "./device/FaceWindowApp";
import "./styles/tokens.css";

const params = new URLSearchParams(window.location.search);
const isFaceWindow =
  params.get("face") === "1" || params.get("window") === "face";

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Taby Custom Agent crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            color: "#f4f4f5",
            background: "#16161a",
            minHeight: "100vh",
            boxSizing: "border-box",
          }}
        >
          <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>
            Taby Custom Agent — UI error
          </h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 12,
              opacity: 0.85,
              lineHeight: 1.4,
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <RootErrorBoundary>
        {isFaceWindow ? <FaceWindowApp /> : <App />}
      </RootErrorBoundary>
    </React.StrictMode>
  );
} else {
  document.body.innerHTML =
    '<p style="padding:24px;font-family:sans-serif">#root missing</p>';
}
