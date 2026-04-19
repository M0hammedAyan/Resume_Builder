import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { rewriteTextWithAI } from "../../services/api.js";

function AISuggestionCard({ text, context, onAccept, buttonLabel = "✨ Improve" }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [originalText, setOriginalText] = useState("");

  const canRequest = useMemo(() => Boolean(text && text.trim()), [text]);

  const handleImprove = async () => {
    setErrorMessage("");
    setSuggestion("");

    if (!canRequest) {
      return;
    }

    const currentText = text.trim();
    setOriginalText(currentText);

    try {
      setLoading(true);
      const response = await rewriteTextWithAI({ text: currentText, context });
      const improvedText = response?.data?.improved_text;

      if (!improvedText || !String(improvedText).trim()) {
        setErrorMessage("AI could not generate a suggestion right now.");
        return;
      }

      setSuggestion(String(improvedText));
    } catch {
      setErrorMessage("AI suggestion is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleImprove}
        disabled={loading || !canRequest}
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
        {buttonLabel}
      </button>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>
      ) : null}

      {suggestion ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">AI suggestion</p>
          <div className="mt-3 grid gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Original</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{originalText}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Improved version</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{suggestion}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onAccept(suggestion);
                setSuggestion("");
                setOriginalText("");
              }}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestion("");
                setOriginalText("");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AISuggestionCard;
