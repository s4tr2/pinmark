"use client";

import { useEffect, useRef, useState } from "react";

export function CopyPrompt({
  label,
  prompt,
}: {
  label: string;
  prompt: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="copy-prompt">
      <div className="copy-prompt-header">
        <span>{label}</span>
        <button
          className="secondary copy-prompt-button"
          type="button"
          onClick={copyPrompt}
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <pre>
        <code>{prompt}</code>
      </pre>
    </div>
  );
}
