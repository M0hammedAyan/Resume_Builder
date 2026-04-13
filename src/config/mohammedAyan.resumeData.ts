import { render_template, type ResumeTemplateData, type TemplateId } from "./resume.templates";

export const MOHAMMED_AYAN_RESUME_DATA: ResumeTemplateData = {
  name: "MOHAMMED AYAN",
  location: "Bengaluru, Karnataka, India",
  email: "mohammedayan262005@gmail.com",
  phone: "+91 6361937273",
  linkedin: "LinkedIn | GitHub",
  summary:
    "AI/ML and computer vision student with hands-on experience in building real-time monitoring systems, multi-camera vision pipelines, and IoT-integrated hardware solutions. Currently working at the Indian Institute of Science on medical video analysis systems, focusing on performance optimization, system integration, and secure data handling. Skilled in Python, OpenCV, and data-driven system design, with a strong interest in scalable, secure digital infrastructure and identity systems.",
  education:
    "B.E. in Artificial Intelligence & Machine Learning, Dr. Ambedkar Institute of Technology, Bengaluru (Oct 2024-Present), CGPA: 6.90 | Diploma in Mechanical Engineering, M.N. Technical Institute, Bengaluru (Jun 2021-2024), CGPA: 9.77",
  role_type: "Research IISc Intern",
  skills: [
    "Python",
    "Model Training",
    "Model Evaluation",
    "Deep Learning",
    "NLP",
    "LLM Fundamentals",
    "Prompt Engineering",
    "Gen AI",
    "OpenCV",
    "Image Processing",
    "Real-Time Detection",
    "Multi-Camera Systems",
    "SolidWorks",
    "AutoCAD",
    "Additive Manufacturing",
    "Non-Destructive Testing (NDT)",
    "Git",
    "GitHub",
    "Linux",
    "PyQt",
    "Pandas",
    "Tableau",
    "Attention to Detail",
    "Leadership",
    "Time Management",
  ],
  experience: [
    {
      title: "Research IISc Intern",
      company: "Indian Institute of Science (IISc), Bengaluru",
      date: "Feb 2026 - Present",
      bullets: [
        "Designed and engineered a custom 3D multi-camera mount with optimized positioning, integrated lighting, and display unit, ensuring infant safety and aesthetic design.",
        "Developed a multi-camera monitoring system (Action Cam + Intel RealSense) for medical applications.",
        "Built a real-time video processing pipeline (30-60 FPS) for stable and efficient performance.",
        "Engineered a custom IoT-integrated hardware setup, combining sensors, embedded systems, and vision modules.",
        "Implementing a secure data transmission mechanism for handling sensitive video data.",
        "Developing a PyQt-based GUI for real-time system control, monitoring, and visualization.",
        "Optimized and integrated hardware, software, and AI components for seamless system performance.",
      ],
    },
    {
      title: "Projects: Attendance & Risk Analysis System (Open Source)",
      company: "Project",
      date: "2025-2026",
      bullets: [
        "Architecting a scalable platform with multi-user role-based access (Admin, HOD, Mentor, Teacher).",
        "Designed an end-to-end data pipeline for attendance tracking and predictive risk analytics.",
        "Collaborating with a 4-member team using version control and structured workflows.",
      ],
    },
    {
      title: "Projects: CareerOS - AI-powered professional profile assistant",
      company: "Project",
      date: "2026",
      bullets: [
        "Engineered a system that transforms raw career data into ATS-optimized, role-specific resumes.",
        "Developing an explainable decision engine using structured memory, vector retrieval, and scoring mechanisms.",
      ],
    },
    {
      title: "Projects: FloodGuard - Flood Detection & Early Warning System (Astrava Hackathon 2025)",
      company: "Project",
      date: "2025",
      bullets: [
        "Expanded a real-time flood prediction system using sensor data (water level, rainfall) and ML models.",
        "Automated early warning alerts through Telegram API integration to improve disaster response time.",
      ],
    },
    {
      title: "Projects: Dual-Agent Multimodal AI Framework for Driver State Monitoring System",
      company: "Project / Publication",
      date: "Nov 2025",
      bullets: [
        "Built a multimodal AI system in Python to detect driver fatigue and distraction.",
        "Implemented an agent-based architecture for processing visual and behavioral data streams.",
        "Publication: A Dual-Agent Multimodal AI Framework for Driver State Monitoring System.",
      ],
    },
    {
      title: "Projects: Magnetic Yoke (NDT)",
      company: "Project",
      date: "2024-2025",
      bullets: [
        "Constructed a magnetic yoke-based NDT system for detecting surface and subsurface defects in ferromagnetic materials.",
      ],
    },
    {
      title: "Certifications & Participation",
      company: "Professional Development",
      date: "2025-2026",
      bullets: [
        "Tata - GenAI Powered Data Analytics Job Simulation.",
        "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate.",
        "Astrava Hackathon 2026.",
        "IDEATHON 2025.",
        "OpenAI x NxtWave.",
        "Avinya TechKnows IT Solutions - 5-Day AI Agents Intensive Course.",
      ],
    },
  ],
};

export const MOHAMMED_AYAN_FILLED_TEMPLATES: Record<TemplateId, string> = {
  template1: render_template("template1", MOHAMMED_AYAN_RESUME_DATA as ResumeTemplateData & Record<string, unknown>),
  template2: render_template("template2", MOHAMMED_AYAN_RESUME_DATA as ResumeTemplateData & Record<string, unknown>),
  template3: render_template("template3", MOHAMMED_AYAN_RESUME_DATA as ResumeTemplateData & Record<string, unknown>),
  template4: render_template("template4", MOHAMMED_AYAN_RESUME_DATA as ResumeTemplateData & Record<string, unknown>),
  template6: render_template("template6", MOHAMMED_AYAN_RESUME_DATA as ResumeTemplateData & Record<string, unknown>),
};
