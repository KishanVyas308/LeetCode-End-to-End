import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from '@monaco-editor/react';
import { userAtom } from "../atoms/userAtom";
import { useRecoilState } from "recoil";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Import spinner icon
import { socketAtom } from "../atoms/socketAtom";
import { useNavigate, useParams } from "react-router-dom";
import { connectedUsersAtom } from "../atoms/connectedUsersAtom";
import { IP_ADDRESS } from "../Globle";

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
      // request to get all users on start
      socket.send(
        JSON.stringify({
          type: "requestToGetUsers",
          userId: user.id
        })
      );


      // request to get all data on start
      socket.send(
        JSON.stringify({
          type: "requestForAllData",
        })
      );
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


  useEffect(() => {
    if (!socket) {
      navigate("/" + parms.roomId);
    }
    else {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // on change of user
        if (data.type === "users") {
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

        // on receive cursor position
        if (data.type === "cursorPosition") {
          // Update cursor position for the user
          const updatedUsers = connectedUsers.map((user) => {
            if (user.id === data.userId) {
              return { ...user, cursorPosition: data.cursorPosition };
            }
            return user;
          });
          setConnectedUsers(updatedUsers);
        }

        // send all data to new user on join  
        if (data.type === "requestForAllData") {
          socket?.send(
            JSON.stringify({
              type: "allData",
              code: code,
              input: input,
              language: language,
              currentButtonState: currentButtonState,
              isLoading: isLoading,
              userId: data.userId
            })
          );
        }

        // on receive all data
        if (data.type === "allData") {
          setCode(data.code);
          setInput(data.input);
          setLanguage(data.language);
          setCurrentButtonState(data.currentButtonState);
          setIsLoading(data.isLoading);
        }

        // // on recive cursor poisition
        // if (data.type === "cursorPosition") {
        //   const updatedUsers = connectedUsers.map((user) => {
        //     if (user.id === data.userId) {
        //       return { ...user, cursorPosition: data.cursorPosition };
        //     }
        //     return user;
        //   });
        //   console.log("updatedUsers", updatedUsers);
          
        //   setConnectedUsers(updatedUsers);
        // }
      };
    }
  }, [code, input, language, currentButtonState, isLoading]);

  const handleSubmit = async () => {
    handleButtonStatus("Submitting...", true);
    const submission = {
      code,
      language,
      roomId: user.roomId,
      input
    };

    socket?.send(user?.id ? user.id : "");

    const res = await fetch(`http://${IP_ADDRESS}:3000/submit`, {
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

  // handle input change multiple user
  const handleInputChange = (e: any) => {
    setInput(e.target.value);
    socket?.send(
      JSON.stringify({
        type: "input",
        input: e.target.value,
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

  const handleEditorDidMount = (editor: any, monaco: any) => {
    console.log("editor", editor);
    console.log("monaco", monaco);

    if (editor) {
      // editor.onDidChangeCursorPosition((event: any) => {
      //   const position = editor.getPosition();
      //   console.log("Cursor Position:", position);
      //   socket?.send(
      //     JSON.stringify({
      //       type: "cursorPosition",
      //       cursorPosition: position,
      //       userId: user.id
      //     })
      //   );
      // });

      // handle code change multiple user
      editor.onDidChangeModelContent((event: any) => {
        console.log("Code Updated:", editor.getValue());
        setCode(editor.getValue());
        socket?.send(
          JSON.stringify({
            type: "code",
            code: editor.getValue(),
            roomId: user.roomId
          })
        );
      });

      // editor.onDidChangeCursorSelection((event: any) => {
      //   const selection = editor.getSelection();
      //   const selectedText = editor.getModel().getValueInRange(selection);
      //   console.log("Selected Code:", selectedText);
      // });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 pt-4">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Left Side: Code Editor */}
          <div className="w-full lg:w-3/4">
            <div className="flex justify-between mb-4 lg:px-3">
              <label className="text-white text-2xl lg:text-3xl">Code Together</label>
              <div className="flex gap-3">
                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmit}
                    className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg shadow-lg transition-transform duration-300 transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  className="bg-gray-800 h-10 text-white px-3 lg:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition duration-300"
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
            <div className="border border-gray-700 rounded-lg overflow-hidden shadow-lg">
              <MonacoEditor
                value={code}
                language={language}
                theme="vs-dark"
                className="lg:h-[90vh] h-[60vh]"
                onMount={handleEditorDidMount}
              />
            </div>
          </div>

          {/* Right Side: Input and Output */}
          <div className="w-full lg:w-1/4 flex flex-col space-y-4">
            {/* User Connected and Invitation Code */}
            <div className="flex flex-col lg:flex-row justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* User Connected */}
              <div className="w-full lg:w-1/2">
                <h2 className="text-lg lg:text-xl font-bold text-gray-400">Users:</h2>
                <div className="bg-gray-800 text-green-400 p-4 rounded-lg mt-2 overflow-y-auto shadow-lg max-h-40 lg:max-h-60">
                  {connectedUsers.length > 0 ? (
                    connectedUsers.map((user: any, index: any) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm lg:text-base">{user.name}</pre>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No user connected yet.</p>
                  )}
                </div>
              </div>
              {/* Invitation Code */}
              <div className="w-full lg:w-1/2">
                <h2 className="text-lg lg:text-xl font-bold text-gray-400">Invitation Code:</h2>
                <div className="bg-gray-800 text-green-400 p-4 rounded-lg mt-2 overflow-y-auto shadow-lg max-h-40 lg:max-h-60">
                  {user.roomId.length > 0 ? (
                    <pre className="whitespace-pre-wrap text-sm lg:text-base">{user.roomId}</pre>
                  ) : (
                    <p className="text-gray-500">No invitation code yet.</p>
                  )}
                </div>
              </div>
            </div>
            {/* Input Section */}
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-400">Input:</h2>
              <textarea
                value={input}
                style={{ height: "120px" }}
                onChange={(e) => handleInputChange(e)}
                placeholder={`Enter input for your code like... \n5 \n10`}
                className="bg-gray-800 text-white w-full p-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 text-sm lg:text-base"
              />
            </div>

            {/* Output Section */}
            <div className="flex-1 pb-8">
              <div className="flex justify-between px-2">
                <h2 className="text-lg lg:text-xl font-bold text-gray-400">Output:</h2>
                <button
                  onClick={() => setOutput([])}
                  className="text-red-500 hover:text-red-600"
                >
                  Clear
                </button>
              </div>

              <div className="bg-gray-800 text-green-400 p-4 max-h-[60vh] rounded-lg mt-2 h-full overflow-y-auto shadow-lg space-y-2 text-sm lg:text-base">
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
