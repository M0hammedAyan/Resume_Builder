import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, TextArea } from "../components/ui/Input";
import { ResumeFileUpload } from "../components/ResumeFileUpload";
import type { ChatMessage, Resume, ResumeBullet, ResumeSectionData, ResumeSection, ChatBotResponse, ResumeParseResult } from "../types/resume";
import { ChevronDown } from "lucide-react";

interface ResumeStudioPageProps {
  userId: string;
  onToast: (title: string, message: string, variant?: "success" | "error" | "info") => void;
}

const SECTION_LABELS: Record<ResumeSection, string> = {
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  achievements: "Achievements",
};

const DEFAULT_SECTIONS: ResumeSectionData[] = [
  { section: "experience", title: "Experience", bullets: [] },
  { section: "projects", title: "Projects", bullets: [] },
  { section: "skills", title: "Skills", bullets: [] },
  { section: "education", title: "Education", bullets: [] },
  { section: "achievements", title: "Achievements", bullets: [] },
];

export function ResumeStudioPage({ userId, onToast }: ResumeStudioPageProps) {
  const [mode, setMode] = useState<"welcome" | "chat" | "edit">("welcome");
  const [resume, setResume] = useState<Resume | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function createNewResume() {
    const newResume: Resume = {
      id: `resume-${Date.now()}`,
      userId,
      title: "My Professional Resume",
      sections: DEFAULT_SECTIONS.map((section) => ({
        ...section,
        bullets: [],
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setResume(newResume);
    setMode("chat");
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your Resume Assistant. Tell me about your professional experiences, projects, skills, or achievements. For example: 'I led a team of 5 engineers to build a payment system that processed $10M in transactions' or 'I deployed a React app to AWS that reduced load time by 40%'",
        timestamp: new Date().toISOString(),
        followUpQuestions: [
          "What's your most recent work experience?",
          "Tell me about a project you're proud of",
          "What are your key technical skills?",
        ],
      },
    ]);
  }

  async function handleResumeUpload(file: File) {
    setUploadFile(file);
    setUploading(true);
    setUploadError(null);

    try {
      const uploadResult = await apiService.uploadResumeFile(userId, file);
      setUploadSuccess(true);
      onToast("Success", "Resume file parsed successfully", "success");

      // Create resume from parsed content
      const parsedContent = uploadResult.parseResult;
      const newResume: Resume = {
        id: uploadResult.resumeId,
        userId,
        title: parsedContent.name ? `${parsedContent.name}'s Resume` : "Uploaded Resume",
        sections: DEFAULT_SECTIONS.map((section) => ({
          ...section,
          bullets:
            section.section === "experience"
              ? parsedContent.experience.map((exp, i) => ({
                  id: `bullet-exp-${i}`,
                  section: "experience" as const,
                  content: exp,
                  score: 0.8,
                  createdAt: new Date().toISOString(),
                }))
              : section.section === "projects"
                ? parsedContent.projects.map((proj, i) => ({
                    id: `bullet-proj-${i}`,
                    section: "projects" as const,
                    content: proj,
                    score: 0.8,
                    createdAt: new Date().toISOString(),
                  }))
                : section.section === "skills"
                  ? parsedContent.skills.map((skill, i) => ({
                      id: `bullet-skill-${i}`,
                      section: "skills" as const,
                      content: skill,
                      score: 0.8,
                      createdAt: new Date().toISOString(),
                    }))
                  : section.section === "education"
                    ? parsedContent.education.map((edu, i) => ({
                        id: `bullet-edu-${i}`,
                        section: "education" as const,
                        content: edu,
                        score: 0.8,
                        createdAt: new Date().toISOString(),
                      }))
                    : [],
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setResume(newResume);
      setMode("chat");
      setMessages([
        {
          id: "upload-welcome",
          role: "assistant",
          content: `Great! I've analyzed your resume and loaded your experience. I can see you have expertise in ${parsedContent.skills.slice(0, 3).join(", ")}. Now, let me help you improve it and make it stand out. What would you like to enhance? We can refine your bullets, add more metrics, or tailor it for a specific job.`,
          timestamp: new Date().toISOString(),
          followUpQuestions: [
            "Improve my experience section with stronger action verbs",
            "Add more quantifiable metrics to my achievements",
            "Help me tailor this for a specific job I'm interested in",
          ],
        },
      ]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to parse resume";
      setUploadError(errorMsg);
      onToast("Upload failed", errorMsg, "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage() {
    if (!userInput.trim() || !resume) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setUserInput("");
    setLoading(true);

    try {
      const response = await apiService.resumeChat({
        userId,
        userInput: userInput,
        resumeId: resume.id,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        followUpQuestions: response.followUpQuestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If bullet was generated, add it to the resume
      if (response.generatedBullet) {
        const updatedSections = resume.sections.map((sec) => {
          if (sec.section === response.generatedBullet!.section) {
            return {
              ...sec,
              bullets: [
                ...sec.bullets,
                {
                  id: `bullet-${Date.now()}`,
                  section: sec.section,
                  content: response.generatedBullet!.content,
                  score: response.confidence,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
          return sec;
        });

        setResume({
          ...resume,
          sections: updatedSections,
          updatedAt: new Date().toISOString(),
        });

        onToast(
          "Bullet added",
          `Added to ${SECTION_LABELS[response.generatedBullet.section]} section`,
          "success"
        );
      }

      onToast("Response received", "Continue the conversation", "info");
    } catch (error) {
      onToast("Chat failed", "Could not process your message", "error");
    } finally {
      setLoading(false);
    }
  }

  function removeBullet(sectionType: ResumeSection, bulletId: string) {
    if (!resume) return;
    const updatedSections = resume.sections.map((sec) => {
      if (sec.section === sectionType) {
        return {
          ...sec,
          bullets: sec.bullets.filter((b) => b.id !== bulletId),
        };
      }
      return sec;
    });
    setResume({
      ...resume,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    });
  }

  function editBullet(sectionType: ResumeSection, bulletId: string, newContent: string) {
    if (!resume) return;
    const updatedSections = resume.sections.map((sec) => {
      if (sec.section === sectionType) {
        return {
          ...sec,
          bullets: sec.bullets.map((b) =>
            b.id === bulletId ? { ...b, content: newContent } : b
          ),
        };
      }
      return sec;
    });
    setResume({
      ...resume,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    });
  }

  if (mode === "welcome") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-[600px] items-center justify-center"
      >
        <Card className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-100">Welcome to Resume Studio</h2>
          <p className="mt-3 text-sm text-slate-300">
            Build your resume with AI assistance. Share your experiences, and I'll help you craft professional bullet points.
          </p>

          {/* File Upload Section */}
          <div className="mt-6 border-t border-slate-700 pt-6">
            <p className="mb-3 text-xs font-medium uppercase text-slate-400">Have an existing resume?</p>
            <ResumeFileUpload
              onFileSelected={handleResumeUpload}
              loading={uploading}
              error={uploadError || undefined}
              success={uploadSuccess}
            />
            {uploadSuccess && (
              <p className="mt-3 text-xs text-green-400">
                Ready to improve your resume? Click the button below or start fresh.
              </p>
            )}
          </div>

          {/* Or divider */}
          <div className="mt-6 flex items-center gap-2">
            <div className="flex-1 border-t border-slate-700" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>

          {/* Create new resume */}
          <div className="mt-6 grid gap-3">
            <Button onClick={createNewResume} className="w-full">
              Create New Resume
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 xl:grid-cols-3"
    >
      {/* Chat Interface */}
      <div className="xl:col-span-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-100">Resume Assistant</h3>
          <div className="mt-4 flex h-[500px] flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-100"
                      }`}
                    >
                      {msg.content}
                      {msg.bulletAdded && (
                        <div className="mt-2 border-t border-opacity-30 pt-2 text-xs">
                          ✓ Added to {SECTION_LABELS[msg.bulletAdded.section]}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Follow-up Questions */}
            {messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
              <div className="mt-3 grid gap-2">
                {messages[messages.length - 1].followUpQuestions?.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUserInput(q);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-slate-700"
                  >
                    → {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="mt-4 flex gap-2">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSendMessage();
                  }
                }}
                placeholder="Tell me what you've accomplished... (Ctrl+Enter to send)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none resize-none"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                loading={loading}
                className="self-end"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Resume Preview */}
      <div className="xl:col-span-1">
        <Card>
          <h3 className="text-lg font-semibold text-slate-100">Resume Builder</h3>
          
          {resume && (
            <div className="mt-4 space-y-4 max-h-[600px] overflow-y-auto">
              {resume.sections.map((section) => (
                <div key={section.section}>
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800">
                      <span>
                        {section.title} ({section.bullets.length})
                      </span>
                      <ChevronDown className="h-4 w-4 transition group-open:-rotate-180" />
                    </summary>
                    <div className="mt-2 space-y-2">
                      {section.bullets.map((bullet) => (
                        <div
                          key={bullet.id}
                          className="flex items-start gap-2 rounded-lg bg-slate-950/60 p-2 text-xs text-slate-200"
                        >
                          <div className="flex-1">
                            <p className="mb-1">{bullet.content}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editBullet(section.section, bullet.id, prompt("Edit bullet:", bullet.content) || bullet.content)}
                                className="text-xs text-blue-400 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeBullet(section.section, bullet.id)}
                                className="text-xs text-red-400 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {bullet.score && (
                            <span className="text-xs text-green-400">
                              {Math.round(bullet.score * 100)}%
                            </span>
                          )}
                        </div>
                      ))}
                      {section.bullets.length === 0 && (
                        <p className="text-xs text-slate-400">No bullets added yet</p>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1">
              Download PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMode("welcome")} className="flex-1">
              New Resume
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
