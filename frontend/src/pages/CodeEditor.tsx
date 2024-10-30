import React, { useState, useEffect } from "react";
import { CodeiumEditor } from "@codeium/react-code-editor";
import { userAtom } from "../atoms/userAtom";
import { useRecoilState } from "recoil";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Import spinner icon
import { socketAtom } from "../atoms/socketAtom";
import { useNavigate, useParams } from "react-router-dom";

const CodeEditor: React.FC = () => {
  const [code, setCode] = useState<any>("// Write your code here...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState<string[]>([]); // Output logs
  const [socket, setSocket] = useRecoilState<WebSocket | null>(socketAtom);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentButtonState, setCurrentButtonState] = useState("Submit Code");
  const [input, setInput] = useState<string>(""); // Input for code
  const [user, setUser] = useRecoilState(userAtom);
  const navigate = useNavigate();


  // multipleyer state
  const [users, setUsers] = useState([]);
  const parms = useParams();

  // WebSocket connection logic
  useEffect(() => {

    if (!socket) {
      navigate("/" + parms.roomId);
    }
    else {
    
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "users") {
          setUsers(data.users);
        }

        if (data.type === "output") {
          setOutput((prevOutput) => [...prevOutput, data.output]);
        }
      };
      socket.onclose = () => {
        console.log("Connection closed");
        setUser({
          id: "",
          name: "",
          roomId: "",
        })
        setSocket(null);
      }
    }
    return () => {
      socket?.close();
    };
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setCurrentButtonState("Submitting...");
    const submission = {
      code,
      language,
      userId: user?.id,
      input
    };

    socket?.send(user?.id ? user.id : "");

    console.log(submission);
    const res = await fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission),
    });

    setCurrentButtonState("Compiling...");

    if (!res.ok) {
      setOutput((prevOutput) => [
        ...prevOutput,
        "Error submitting code. Please try again.",
      ]);
      setIsLoading(false);
      setCurrentButtonState("Submit Code");
    }
  };

  return (
    <div className="min-h-screen  bg-gray-900 text-white px-4 pt-4">
      <div className=" mx-auto">


        <div className="flex space-x-4">
          {/* Left Side: Code Editor */}
          <div className="w-3/4">
            <div className="flex justify-between mb-4 px-3">
              <label className="text-white text-3xl">Code Together</label>
              <div className="flex gap-3">

                {/* Submit Button */}
                <div className="flex justify-center ">
                  <button
                    onClick={handleSubmit}
                    className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-transform duration-300 transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <span className="flex items-center space-x-2">
                      {isLoading && <AiOutlineLoading3Quarters className="animate-spin" />}
                      <span>{currentButtonState}</span>
                    </span>
                  </button>
                </div>
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-800 h-10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition duration-300"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                </select>
              </div>
            </div>

            {/* Code Editor */}
            <div className="border border-gray-700 rounded-tl-lg rounded-bl-lg overflow-hidden shadow-lg ">
              <CodeiumEditor
                value={code}
                language={language}
                theme="vs-dark"
                onChange={setCode}
                height={"90vh"}
              />
            </div>
          </div>

          {/* Right Side: Input and Output */}
          <div className="w-1/4 flex flex-col space-y-4">

            {/* user connected and invition code */}
            <div className="flex justify-between ">
              {/* User Connected */}
              <div>
                <h2 className="text-xl font-bold text-gray-400">Users:</h2>
                <div className="bg-gray-800 text-green-400 p-4  rounded-lg mt-2 overflow-y-auto shadow-lg ">
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <pre key={index} className="whitespace-pre-wrap">{user}</pre>
                    ))
                  ) : (
                    <p className="text-gray-500">No user connected yet.</p>
                  )}
                </div>
              </div>
              {/* Invitation Code */}
              <div>
                <h2 className="text-xl font-bold text-gray-400">Invitation Code:</h2>
                <div className="bg-gray-800 text-green-400 p-4 rounded-lg mt-2  overflow-y-auto shadow-lg ">
                  {user.roomId.length > 0 ? (
                    <pre className="whitespace-pre-wrap">{user.roomId}</pre>
                  ) : (
                    <p className="text-gray-500">No invitation code yet.</p>
                  )}
                </div>
              </div>
            </div>
            {/* Input Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-400">Input:</h2>
              <textarea
                value={input}
                style={{ height: "120px" }}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Enter input for your code like... \n5 \n10`}
                className="bg-gray-800 text-white w-full p-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              />
            </div>



            {/* Output Section */}
            <div className="flex-1">


              <div className="flex justify-between px-2">
                <h2 className="text-xl font-bold text-gray-400">Output:</h2>
                <button
                  onClick={() => setOutput([])}
                  className="text-red-500 hover:text-red-600"
                >
                  Clear
                </button>
              </div>

              <div className="bg-gray-800 text-green-400 p-4 max-h-[60vh] rounded-lg mt-2 h-full overflow-y-auto shadow-lg space-y-2 ">
                {output.length > 0 ? (
                  output.map((line, index) => (
                    <pre key={index} className="whitespace-pre-wrap">{line}</pre>
                  ))
                ) : (
                  <p className="text-gray-500">No output yet. Submit your code to see results.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
