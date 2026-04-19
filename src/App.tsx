import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResumeEntry from "./pages/ResumeEntry";
import ResumeBuilder from "./pages/ResumeBuilder";
import ResumeUpload from "./pages/ResumeUpload";
import ResumeStudio from "./pages/ResumeStudio";
import RecruiterLens from "./pages/RecruiterLens";
import Insights from "./pages/Insights";
import ExportPage from "./pages/ExportPage";

function App() {
  const [resumeJson, setResumeJson] = useState(null);
  const [resumeId, setResumeId] = useState("");

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/resume" element={<ResumeEntry />} />
      <Route
        path="/resume/build"
        element={<ResumeBuilder setResumeJson={setResumeJson} setResumeId={setResumeId} />}
      />
      <Route
        path="/resume/upload"
        element={<ResumeUpload setResumeJson={setResumeJson} setResumeId={setResumeId} />}
      />
      <Route
        path="/resume/studio"
        element={
          <ResumeStudio
            resumeJson={resumeJson}
            setResumeJson={setResumeJson}
            resumeId={resumeId}
            setResumeId={setResumeId}
          />
        }
      />
      <Route path="/recruiter-lens" element={<RecruiterLens />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
