import React, { useState, useEffect } from "react";
import { CodeiumEditor } from "@codeium/react-code-editor";
import { userAtom } from "../atoms/userAtom";
import { useRecoilState } from "recoil";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Import spinner icon
import { socketAtom } from "../atoms/socketAtom";
import { useNavigate, useParams } from "react-router-dom";
import { connectedUsersAtom } from "../atoms/connectedUsersAtom";

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
  const [connectedUsers, setConnectedUsers] = useRecoilState<any[]>(connectedUsersAtom);
  const parms = useParams();

  // WebSocket connection logic
  useEffect(() => {

    if (!socket) {
      navigate("/" + parms.roomId);
    }
    else {

      socket.send(
        JSON.stringify({
          type: "requestToGetUsers",
          roomId: user.roomId
        })
      );

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // on chanege of user
        if (data.type === "users") {
          console.log(data.users);
          setConnectedUsers(data.users);
        }
        // on change of code
        if (data.type === "code") {
          setCode(data.code);
        }

        // on change of input
        if (data.type === "input") {
          setInput(data.input);
        }

        // on change of language
        if (data.type === "language") {
          setLanguage(data.language);
        }

        // on change of Submit Button Status
        if (data.type === "submitBtnStatus") {
          setCurrentButtonState(data.value);
          setIsLoading(data.isLoading);
        }


        // on change of output
        if (data.type === "output") {
          setOutput((prevOutput) => [...prevOutput, data.message]);
          handleButtonStatus("Submit Code", false);
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

    handleButtonStatus("Submitting...", true);
    const submission = {
      code,
      language,
      roomId: user.roomId,
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


    handleButtonStatus("Compiling...", true);

    if (!res.ok) {
      setOutput((prevOutput) => [
        ...prevOutput,
        "Error submitting code. Please try again.",
      ]);
      handleButtonStatus("Submit Code", false);
    }
  };


  // handle code change multiple user
  const handleCodeChange = (value: any) => {
    setCode(value);
    socket?.send(
      JSON.stringify({
        type: "code",
        code: value,
        roomId: user.roomId
      })
    );
  }

  // handle input change multiple user
  const handleInputChange = (e: any) => {
    setInput(e.target.value);
    socket?.send(
      JSON.stringify({
        type: "input",
        input: e.target.value
        ,
        roomId: user.roomId
      })
    );
  }

  // handle language change multiple user
  const handleLanguageChange = (value: any) => {
    setLanguage(value);
    socket?.send(
      JSON.stringify({
        type: "language",
        language: value,
        roomId: user.roomId
      })
    );
  }

  // handle submit button status multiple user
  const handleButtonStatus = (value: any, isLoading: any) => {
    setCurrentButtonState(value);
    setIsLoading(isLoading);
    socket?.send(
      JSON.stringify({
        type: "submitBtnStatus",
        value: value,
        isLoading: isLoading,
        roomId: user.roomId
      })
    );
  }


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
                  onChange={(e) => handleLanguageChange(e.target.value)}
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
                onChange={(value) => handleCodeChange(value)}
                height={"90vh"}
              />
            </div>
          </div>

          {/* Right Side: Input and Output */}
          <div className="w-1/4 flex flex-col space-y-4">

            {/* user connected and invition code */}
            <div className="flex justify-between ">
              {/* User Connected */}
              <div className="w-1/2">
                <h2 className="text-xl font-bold text-gray-400">Users:</h2>
                <div className="bg-gray-800 text-green-400 p-4  rounded-lg mt-2 overflow-y-auto  shadow-lg ">
                  {connectedUsers.length > 0 ? (
                    connectedUsers.map((user: any, index: any) => (
                      <pre key={index} className="whitespace-pre-wrap">{user.name}</pre>
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
                onChange={(e) => handleInputChange(e)}
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
