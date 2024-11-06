import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import CodeEditor from "./pages/CodeEditor.tsx";
import { RecoilRoot } from "recoil";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
 
    <RecoilRoot>
      <App />
    </RecoilRoot>
);
