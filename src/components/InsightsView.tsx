import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Target, Lightbulb } from "lucide-react";

export function InsightsView() {
  // These would come from the backend/store in a real application
  const insights = {
    growthTrend: "increasing" as const,
    strengthAreas: [
      "Leadership & Team Management",
      "Full-stack Development",
      "Project Delivery",
    ],
    weakAreas: [
      "Limited cloud infrastructure experience",
      "Few certifications",
      "Emerging tech adoption",
    ],
    recommendations: [
      "Pursue AWS Solutions Architect certification",
      "Document recent DevOps improvements",
      "Highlight leadership impact with metrics",
      "Build projects with modern frameworks",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-slate-100">Career Insights</h2>
        <p className="mt-2 text-slate-400">
          AI-powered analysis of your professional profile
        </p>
      </motion.div>

      {/* Growth Trend */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-slate-800 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-emerald-500/20 p-3">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Career Growth Trend</h3>
            <p className="mt-1 text-sm text-slate-400">
              Your professional profile is showing steady growth with consistent
              skill expansion and impact metrics.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-cyan-500/20 p-2">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-slate-100">Strength Areas</h3>
          </div>
          <ul className="space-y-3">
            {insights.strengthAreas.map((area, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                <span>{area}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Weak Areas */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <BarChart3 className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-slate-100">Areas to Develop</h3>
          </div>
          <ul className="space-y-3">
            {insights.weakAreas.map((area, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-yellow-400" />
                <span>{area}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-lg border border-slate-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-purple-500/20 p-2">
            <Lightbulb className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-100">Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.25 + index * 0.05 }}
              className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3"
            >
              <p className="text-sm text-slate-300">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-lg border border-slate-800 bg-slate-900/50 p-6"
      >
        <h3 className="font-semibold text-slate-100 mb-3">Suggested Next Steps</h3>
        <ol className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-3">
            <span className="font-semibold text-cyan-400">1.</span>
            <span>Visit Resume Studio and select the Professional Classic template</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-cyan-400">2.</span>
            <span>Use Chat to refine your achievement descriptions with metrics</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-cyan-400">3.</span>
            <span>Check your resume against target jobs in Recruiter Lens</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-cyan-400">4.</span>
            <span>Download your resume and apply to roles</span>
          </li>
        </ol>
      </motion.div>
    </div>
  );
}
