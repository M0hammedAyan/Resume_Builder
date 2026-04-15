import { useEffect, useRef, useState } from "react";

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  placement?: "top" | "bottom";
  delayMs?: number;
};

export function Tooltip({ label, children, placement = "top", delayMs = 220 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleEnter = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setVisible(true), delayMs);
  };

  const handleLeave = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  return (
    <span className="doc-tooltip-wrapper" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <span
        className={`doc-tooltip doc-tooltip-${placement} ${visible ? "doc-tooltip-visible" : ""}`}
        role="tooltip"
        aria-hidden={!visible}
      >
        {label}
      </span>
    </span>
  );
}
