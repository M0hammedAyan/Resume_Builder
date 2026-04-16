import { motion } from "framer-motion";
import { BarChart3, Lightbulb, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { useCareerOSStore } from "../store/careeros.store";
import type { ResumeInsightsAnalysis } from "../types/app";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function InsightsView() {
  const { resume } = useCareerOSStore();
  const [insights, setInsights] = useState<ResumeInsightsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasResumeData = !!resume && (
    resume.summary.trim().length > 0 ||
    resume.skills.length > 0 ||
    resume.experience.length > 0 ||
    resume.projects.length > 0 ||
    resume.education.length > 0 ||
    resume.achievements.length > 0
  );

  const chartData = insights
    ? Object.entries(insights.skill_distribution)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  const fetchInsights = async () => {
    if (!resume || !hasResumeData) {
      setInsights(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getInsights({
        resume_data: resume as unknown as Record<string, unknown>,
      });
      console.log("Insights response:", response);
      setInsights(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [resume]);

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

      {!hasResumeData && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
          Upload or create a resume to see insights
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
          Loading insights...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && hasResumeData && !insights && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
          No insights available.
        </div>
      )}

      {!insights ? null : (
        <>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-slate-800 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-xs text-slate-400">Resume Score</p>
              <p className="text-2xl font-bold text-slate-100">{insights.resume_score}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            <div>
              <p className="text-xs text-slate-400">Experience Level</p>
              <p className="text-2xl font-bold text-slate-100">{insights.experience_level}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-lg border border-slate-800 bg-slate-900/50 p-6"
      >
        <h3 className="mb-3 font-semibold text-slate-100">Skill Distribution</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400">No skill frequency data available.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="skill" tick={{ fill: "#cbd5e1", fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#cbd5e1", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
            {insights.strength_areas.map((area, index) => (
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
            {insights.weak_areas.map((area, index) => (
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

        </>
      )}
    </div>
  );
}
