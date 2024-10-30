import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import CodeEditor from "./pages/CodeEditor";
import ProtectedRouter from "./middleWare/ProtectedRouter";

const App = () => {
  return (
    <Router>
      <Routes>

        {/* Route for CodeEditor with ProtectedRouter */}
        <Route
          path="/:roomId"
          element={<Register />} />
        {/* Define a route for the home path */}
        <Route path="/" element={<Register />} />

        {/* Correct route syntax for Register with roomId */}
        <Route path="/code/:roomId" element={ <ProtectedRouter  > <CodeEditor /> </ProtectedRouter>} />
      </Routes>
    </Router>
  );
};

export default App;
