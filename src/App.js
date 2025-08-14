import React, { use, useState, useEffect } from "react";
import forge from 'node-forge';
import * as aes from "./encrypt"; 

const pendingPromises = {};

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [nativeMessage, setNativeMessage] = useState(null);
  const [info, setInfo] = useState(null);

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
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.myHandlerName) {
      window.webkit.messageHandlers.myHandlerName.postMessage(message);
    } else {
      console.warn("Native handler not available");
    }
  }

  function updateFromNative(message) {
    document.getElementById("inputField").value = message;
  }

  useEffect(() => {
    window.receiveMessageFromNative = function (message) {
      setNativeMessage(message);
    };
  }, []);

  function requestUserInfo() {
    requestToNative({}, "GET_USER_INFO")
      .then((userInfo) => {
        let userInfoString = JSON.stringify(userInfo, null, 2);
        console.log("User info received:", userInfoString);
        try {
          let info = 'I am ' + userInfo["name"] + " and I am " + userInfo["age"] + " years old.";
          setInfo(info);
        } catch (error) {
          console.error("Failed to parse user info:", error);
          setInfo(userInfoString);
        }
        sendMessageToNativeApp("User info loaded successfully");
      })
      .catch((error) => {
        console.error("Failed to load user info:", error);
        setInfo(null);
        sendMessageToNativeApp("Failed to load user info: " + error.message);
      });
  }

  window.setAESKey = function (cipherText) {
    aes.setAESKey(cipherText);
  };

  useEffect(() => {
    window.onResponseFromNative = function (data) {
      console.log("Response from native:", data);
      let decryptedData = aes.decryptAES(data);
      if (decryptedData == null) {
        console.error("Decryption failed or returned null");
        delete pendingPromises[requestId];
        return;
      }

      let jsonData = JSON.parse(decryptedData);
      console.log("Parsed JSON data:", decryptedData);
      let requestId = jsonData["request_id"];
      if (pendingPromises[requestId]) {
        console.warn("Promise found for request ID: " + requestId);
        if (jsonData["success"] === false) {
          pendingPromises[requestId].reject(new Error("Request failed"));
          delete pendingPromises[requestId];
          return;
        }
        let payload = jsonData["payload"];
        try {
          pendingPromises[requestId].resolve(payload);
        } catch (error) {
          pendingPromises[requestId].reject(new Error("Failed to parse response: " + error.message));
        } finally {
          delete pendingPromises[requestId];
        }
      } else {
        console.warn("No pending promise found for request ID: " + requestId + ". Data: " + data);
      }
    };
  }, []);

  function requestToNative(data, type) {
    return new Promise((resolve, reject) => {
      if (window.MiniWebJSBridge && window.MiniWebJSBridge.requestToNative) {
        const requestId = (Date.now() + Math.random()).toString();
        pendingPromises[requestId] = { resolve, reject };
        let message = {
          "request_id": requestId,
          "type": type,
          "mini_app_id": "391999"
        };
        message["payload"] = data;
        let encryptedMessage = aes.encryptAES(JSON.stringify(message));
        console.log("Requesting from native with message:", JSON.stringify(message));
        window.MiniWebJSBridge.requestToNative(encryptedMessage);
      }
    });
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Hello from WebView (update 1.1)</h1>
      <h2>Message from native app</h2>
      <p id="native-message">Message from Native: {nativeMessage ? nativeMessage : "null"}</p>
      <p id="info">
        User Info: {info ? info : "Null"}
      </p>
      <button onClick={() => requestUserInfo()} style={{ padding: 10, fontSize: 16 }}>
        Request User Info
      </button>
      <br></br>
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