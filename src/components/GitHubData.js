import React, { useState } from 'react';

function GitHubData({ onSendMessageToNative }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = () => {
    fetch("https://api.github.com/users/octocat")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        onSendMessageToNative("Loading data from GitHub API successfully");
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

  return (
    <div>
      <button onClick={loadData} style={{ padding: 10, fontSize: 16 }}>
        Load API Data
      </button>
      <pre style={{ marginTop: 20, background: "#f0f0f0", padding: 10 }}>
        {error ? error : data ? JSON.stringify(data, null, 2) : "Click the button to load data from GitHub API."}
      </pre>
    </div>
  );
}

export default GitHubData; 