import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { userAtom } from '../atoms/userAtom';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState<string>("");
    const [age, setAge] = useState<number>(0); 
    const [user, setUser] = useRecoilState(userAtom);
    const navigate = useNavigate();

    const generateId = () => {
        const id = Math.floor(Math.random() * 1000);
        return id.toString();
    }

    const handleSubmit = () => {
        setUser({
            id: generateId(),
            name: name,
            age: age
        });
        navigate("/");
    };

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
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-6"
                />

                <button
                    onClick={handleSubmit}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default Register;
