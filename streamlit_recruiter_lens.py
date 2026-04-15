from __future__ import annotations

import streamlit as st
import plotly.graph_objects as go

from app.services.recruiter_lens_service import RecruiterLensService

st.set_page_config(page_title="Recruiter Lens", page_icon="RL", layout="wide")
st.title("Recruiter Lens")
st.caption("Structured semantic resume-vs-JD analysis with actionable feedback")

uploaded_file = st.file_uploader(
    "Upload resume",
    type=["pdf", "docx", "txt"],
    help="Supported formats: PDF, DOCX, TXT",
)

jd_text = st.text_area("Paste Job Description", height=220)
analyze = st.button("Analyze Resume", type="primary")

if analyze:
    if uploaded_file is None:
        st.error("Please upload a resume file.")
    elif not jd_text.strip():
        st.error("Please paste a job description.")
    else:
        with st.spinner("Running Recruiter Lens analysis..."):
            service = RecruiterLensService()
            result = service.analyze_resume(
                resume_bytes=uploaded_file.getvalue(),
                filename=uploaded_file.name,
                job_description=jd_text,
            )

        col1, col2, col3 = st.columns(3)
        col1.metric("Final Score", f"{result['score']:.1f}")
        col2.metric("Hard Skill Match", f"{result['skill_match']:.1f}")
        col3.metric("Experience Match", f"{result['experience_match']:.1f}")

        chart_values = {
            "Hard Skills": result["skill_match"],
            "Preferred Skills": result["preferred_skill_match"],
            "Experience": result["experience_match"],
            "Context": result["keyword_context_match"],
        }

        fig = go.Figure(
            data=[
                go.Bar(
                    x=list(chart_values.keys()),
                    y=list(chart_values.values()),
                    marker_color=["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444"],
                )
            ]
        )
        fig.update_layout(
            title="Score Breakdown",
            yaxis_title="Score",
            yaxis_range=[0, 100],
            template="plotly_white",
            height=360,
        )
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("Missing Skills")
        if result["missing_skills"]:
            st.write(result["missing_skills"])
        else:
            st.success("No critical skill gaps detected.")

        st.subheader("Suggestions")
        if result["suggestions"]:
            for item in result["suggestions"]:
                st.write(f"- {item}")
        else:
            st.info("No major issues found in bullet quality.")

        st.subheader("ATS Issues")
        if result["ats_issues"]:
            for issue in result["ats_issues"]:
                st.write(f"- {issue}")
        else:
            st.success("No ATS compatibility issues detected.")

        with st.expander("Structured Resume JSON"):
            st.json(result["structured_resume"])

        with st.expander("Analysis Metadata"):
            st.json(result["metadata"])
