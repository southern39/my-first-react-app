import React, { useState, useEffect } from 'react';

function NativeCommunication() {
  const [nativeMessage, setNativeMessage] = useState(null);

  useEffect(() => {
    window.receiveMessageFromNative = function (message) {
      setNativeMessage(message);
    };
  }, []);

  return (
    <div>
      <h2>Message from native app</h2>
      <p id="native-message">Message from Native: {nativeMessage ? nativeMessage : "null"}</p>
    </div>
  );
}

export default NativeCommunication; 