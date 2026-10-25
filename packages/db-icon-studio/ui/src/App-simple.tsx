/**
 * Simple test version to check if React works
 */

import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    setMessage("React is working!");

    // Listen to messages from plugin
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      console.log("Received message:", msg);
    };
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <h1>DB Icon Creator</h1>
      <p>{message}</p>
      <button onClick={() => alert("Button clicked!")}>Test Button</button>
    </div>
  );
}

export default App;
