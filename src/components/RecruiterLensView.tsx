import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Lightbulb, Zap } from "lucide-react";
import { useCareerOSStore } from "../store/careeros.store";
import { useState } from "react";

export function RecruiterLensView() {
  const { jobDescription, setJobDescription, jobMatchAnalysis, setJobMatchAnalysis, resume } = useCareerOSStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resume) return;
    setIsAnalyzing(true);

    try {
      // Mock analysis - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockAnalysis = {
        matchScore: 78,
        matchedSkills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
        missingSkills: ["Kubernetes", "GraphQL", "Python"],
        weakAreas: ["Limited DevOps experience", "Few cloud certifications"],
        suggestions: [
          "Highlight AWS projects more prominently",
          "Add a section about infrastructure improvements",
          "Consider learning Kubernetes",
        ],
      };

      setJobMatchAnalysis(mockAnalysis);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Left Panel - Job Description Input */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:col-span-1 flex flex-col gap-4"
      >
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-slate-100 mb-3">Job Description</h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !jobDescription.trim()}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-medium text-white transition hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Check Fit"}
          </button>
        </div>
      </motion.div>

      {/* Right Panel - Analysis Results */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="lg:col-span-2 flex-1"
      >
        {!jobMatchAnalysis ? (
          <div className="h-full flex items-center justify-center rounded-lg border border-slate-800 border-dashed bg-slate-900/20">
            <div className="text-center">
              <Zap className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Paste a job description and click Check Fit</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto h-full pr-2">
            {/* Match Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-slate-800 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-4 border-cyan-500 bg-slate-900/70 mb-3">
                  <span className="text-4xl font-bold text-cyan-400">
                    {jobMatchAnalysis.matchScore}%
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Match Score</h3>
                <p className="mt-1 text-sm text-slate-400">
                  You're a {jobMatchAnalysis.matchScore > 75 ? "strong" : "potential"} fit for this role
                </p>
              </div>
            </motion.div>

            {/* Matched Skills */}
            {jobMatchAnalysis.matchedSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-slate-100">Matched Skills</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jobMatchAnalysis.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Missing Skills */}
            {jobMatchAnalysis.missingSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <h4 className="font-semibold text-slate-100">Missing Skills</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jobMatchAnalysis.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weak Areas */}
            {jobMatchAnalysis.weakAreas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
              >
                <h4 className="font-semibold text-slate-100 mb-3">Areas to Develop</h4>
                <ul className="space-y-2">
                  {jobMatchAnalysis.weakAreas.map((area) => (
                    <li key={area} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-1">→</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Suggestions */}
            {jobMatchAnalysis.suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="rounded-lg border border-slate-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-purple-400" />
                  <h4 className="font-semibold text-slate-100">Suggestions</h4>
                </div>
                <ul className="space-y-2">
                  {jobMatchAnalysis.suggestions.map((suggestion) => (
                    <li key={suggestion} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-purple-400 mt-1">✨</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
