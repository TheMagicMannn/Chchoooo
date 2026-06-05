import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "text" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 overflow-hidden rounded-md border border-border/50 bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
          title="Copy code"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <Highlight theme={themes.vsDark} code={code.trim()} language={language as any}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={{ ...style, backgroundColor: "transparent", margin: 0 }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell text-right pr-4 text-muted-foreground/30 select-none border-r border-border/10 text-xs">
                    {i + 1}
                  </span>
                  <span className="table-cell pl-4">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
