import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import CodeEditor from "./pages/CodeEditor";
import ProtectedRouter from "./middleWare/ProtectedRouter";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
       
        <Route
          path="/"
          element={<ProtectedRouter children={<CodeEditor />} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
