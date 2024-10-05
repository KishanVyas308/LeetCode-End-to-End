import React, { useState, useEffect, useRef } from "react";
import { CodeiumEditor } from "@codeium/react-code-editor"; // Import the new editor
import "./App.css"; // Tailwind styles for the app

interface Submission {
  code: string;
  language: string;
  userId: string;
}

const App: React.FC = () => {
  const [code, setCode] = useState<any>("// Write your code here...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState<string[]>([]); // Output logs
  const wsRef = useRef<WebSocket | null>(null); // WebSocket connection reference
  const [isLoading, setIsLoading] = useState(false); // Loading state

  useEffect(() => {
    if (!wsRef.current) {
      const ws = new WebSocket(`ws://localhost:3000`);
      wsRef.current = ws;
  
      ws.onopen = () => {
        console.log("Connected to WebSocket");
      };
  
      ws.onmessage = (event) => {
        const data = event.data;
        setOutput((prevOutput) => [...prevOutput, data]); // Append real-time output
      };
  
      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
  
      return () => {
        ws.close(); // Cleanup WebSocket connection on unmount
      };
    }
  }, []);
  
  const handleSubmit = async () => {
    setIsLoading(true);
    const submission = {
      code,
      language,
      userId: "1",
    };
  
    const res = await fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission),
    });
  
    setIsLoading(false);
  
    if (!res.ok) {
      setOutput((prevOutput) => [
        ...prevOutput,
        "Error submitting code. Please try again.",
      ]);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Code Editor</h1>
  
        <div className="mb-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>
  
        <CodeiumEditor
          value={code}
          language={language}
          theme="vs-dark"
          onChange={setCode}
        />
  
        <button
          onClick={handleSubmit}
          className={`bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 mt-4 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Code'}
        </button>
  
        <h2 className="text-xl font-bold mt-8">Output:</h2>
  
        <div className="bg-black text-green-400 p-4 rounded mt-2 h-64 overflow-y-auto">
          {output.map((line, index) => (
            <pre key={index}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
  
};

export default App;
