import React, { use, useState, useEffect } from "react";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [nativeMessage, setNativeMessage] = useState(null);

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

  function updateFromNative(message) {
    document.getElementById("inputField").value = message;
  }

  useEffect(() => {
    window.receiveMessageFromNative = function (message) {
      setNativeMessage(message); // Update React state
    };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Hello from WebView (update 1.1)</h1>
      <h2>Message from native app</h2>
      <p id="native-message">Message from Native: {nativeMessage ? nativeMessage : "null"}</p>
      <a href="https://www.google.com">Google</a>
      <br></br>
      <a href="https://vi.wikipedia.org/wiki/Doraemon" target="_blank" rel="noopener noreferrer">Doraemon</a>
      <br></br>
      <a href="https://viettelstore.vn/">Viettel Store</a>
      <br></br>
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