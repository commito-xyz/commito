"use client";

import { useCopy } from "@/components/site/CaCopy";

export function CodeBox({ label, code }: { label: string; code: string }) {
  const { copied, copy } = useCopy(code);
  return (
    <div className="cm-codebox my-4">
      <div className="cm-codebox-head">
        <span>{label}</span>
        <button type="button" className="cm-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}
