export type NavPage = "dashboard" | "events" | "resume" | "insights";

export interface EventItem {
  id: string;
  action: string;
  domain: string;
  impact_metric: string;
  impact_improvement: string;
  role_context?: string;
  tools?: string[];
}

export interface ResumeGenerateResponse {
  bullets: string[];
  scores: {
    event_scores: Array<{
      event_id: string;
      score: number;
      breakdown: Record<string, number | Record<string, number>>;
    }>;
    weights?: Record<string, number>;
  };
  selected_events: EventItem[];
  explanations: Array<{
    event_id: string;
    decision: "included" | "excluded";
    reason: string;
    score_breakdown: Record<string, number | Record<string, number>>;
    score: number;
  }>;
  evaluation: {
    overall_score: number;
    breakdown: Record<string, number>;
  };
}

export interface RecruiterResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface CareerInsights {
  growth_trend: "increasing" | "stagnant";
  strength_areas: string[];
  weak_areas: string[];
  recommendations: string[];
}

export interface JobMatchResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommended_actions: string[];
}

export interface SkillGapResult {
  missing_skills: string[];
  priority_ranking: Array<{
    skill: string;
    priority: number;
    reason: string;
  }>;
}

export interface ResumeVersion {
  id: string;
  created_at: string;
  ats_score: number;
  job_description: string;
  bullets_count: number;
}

export interface ResumeVersionCompare {
  version_a_id: string;
  version_b_id: string;
  score_delta: number;
  added_bullets: string[];
  removed_bullets: string[];
  common_bullets: string[];
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  variant?: "success" | "error" | "info";
}
