import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useCareerOSStore } from "../store/careeros.store";
import { useState } from "react";
import type { ChatMessage } from "../types/resume";

export function ChatView() {
  const { chatMessages, addChatMessage } = useCareerOSStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      // Mock API call - replace with your actual endpoint
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              response: `Great! I've noted your update: "${input}". This could be a strong addition to your experience section. Would you like me to refine this further or explore related opportunities?`,
            },
          });
        }, 1000);
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: (response as any).data.response,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(assistantMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat History */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-y-auto px-4 py-8"
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-block rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-4">
                <Sparkles className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">
                Welcome to CareerOS
              </h2>
              <p className="mt-2 text-slate-400">
                Describe your latest career achievement or update
              </p>
              <p className="mt-4 max-w-md text-sm text-slate-500">
                Start a conversation about your projects, accomplishments, or career goals.
                I'll help you turn them into compelling resume content.
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {chatMessages.map((message: ChatMessage, index: number) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-sm rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-slate-700"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl bg-slate-800 px-4 py-3 border border-slate-700">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce" />
                    <div
                      className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="border-t border-slate-800 bg-gradient-to-t from-slate-950 to-slate-900/50 p-4"
      >
        <form onSubmit={handleSendMessage} className="mx-auto max-w-2xl">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your career update..."
              disabled={isLoading}
              className="flex-1 rounded-full border border-slate-700 bg-slate-900/50 px-5 py-3 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-medium text-white shadow-lg transition hover:shadow-cyan-500/50 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">
            💡 Tip: Be specific about metrics and impact
          </p>
        </form>
      </motion.div>
    </div>
  );
}
