import React, { useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = () => {
    fetch("https://api.github.com/users/octocat")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        sendMessageToNativeApp("Loading data from GitHub API successfully");
        return res.json();
      })
      
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        setData(null);
        setError("Failed to load data: " + err.message);
      });
  };

  function sendMessageToNativeApp(message) {
    if (window.MiniWebJSBridge && window.MiniWebJSBridge.sendMessageToNative) {
      window.MiniWebJSBridge.sendMessageToNative(message);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Hello from WebView (update 1.1)</h1>
      <button onClick={loadData} style={{ padding: 10, fontSize: 16 }}>
        Load API Data
      </button>
      <pre style={{ marginTop: 20, background: "#f0f0f0", padding: 10 }}>
        {error ? error : data ? JSON.stringify(data, null, 2) : "Click the button to load data from GitHub API."}
      </pre>
    </div>
  );
}

export default App;