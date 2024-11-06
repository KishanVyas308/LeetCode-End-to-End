import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { userAtom } from '../atoms/userAtom';
import { useNavigate, useParams } from 'react-router-dom';
import { socketAtom } from '../atoms/socketAtom';
import { IP_ADDRESS } from '../Globle';

const Register = () => {
    const [name, setName] = useState<string>("");
    const [roomId, setRoomId] = useState<string>("");

    const parms = useParams();
    const [user, setUser] = useRecoilState(userAtom);
    const [socket, setSocket] = useRecoilState<WebSocket | null>(socketAtom);

    const [loading, setLoading] = useState<boolean>(false);

    const navigate = useNavigate();

    const generateId = () => {
        const id = Math.floor(Math.random() * 100000);
        return id.toString();
    }

    const initializeSocket = () => {
        setLoading(true);
        let GeneratedId = "";
        if (user.id == "") {
            GeneratedId = generateId();
            setUser({
                id: GeneratedId,
                name: name,
                roomId: ""
            });
        }

        if (!socket || socket.readyState === WebSocket.CLOSED) {
            const u = {
                id: user.id == "" ? GeneratedId : user.id,
                name: name
            }
            if(name == "") {
                alert("Please enter a name to continue");
                setLoading(false);
                return;
            }
            const ws = new WebSocket(`ws://${IP_ADDRESS}:5000?roomId=${roomId}&id=${u.id}&name=${u.name}`);
          
            setSocket(ws);


            ws.onopen = () => {
                console.log("Connected to WebSocket");
            };

            ws.onopen = () => {
                console.log("Connected to WebSocket");
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type == "roomId") {
                    setRoomId(data.roomId);
                    console.log("Room ID : ", data.roomId);
                    setUser({
                        id: user.id == "" ? GeneratedId : user.id,
                        name: name,
                        roomId: data.roomId
                    });
                   
                    setLoading(false);
                    alert(data.message);
                    navigate("/code/" + data.roomId);
                }
            };
            ws.onclose = () => {
                console.log("WebSocket connection closed from register page");
                setLoading(false);
            };

        }
        else {

            setLoading(false);
        }
    }

    const handleNewRoom = () => {
        if (!loading)
            initializeSocket();

    }

    const handleJoinRoom = () => {
        if (roomId != "" && roomId.length == 6 && !loading) {

            initializeSocket();

        }
        else {
            alert("Please enter a room ID to join a room");
        }

    }

    useEffect(() => {
        setRoomId(parms.roomId || "");
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">Register</h1>

                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-4"
                />

                <input
                    type="number"
                    placeholder="Room ID (Optional)"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-6"
                />

                <button
                    disabled={loading}
                    onClick={handleNewRoom}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105"
                >
                    Create New Room
                </button>
                <button
                    disabled={loading}
                    onClick={handleJoinRoom}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105 mt-4"
                >
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default Register;
