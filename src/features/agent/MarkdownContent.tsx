"use client"

import ReactMarkdown from "react-markdown"

/**
 * MarkdownContent — assistant text rendering (Block #4). Settled design:
 * chatArea convention (plain text, no bubble). Token-only styling.
 */
export function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="markdown-content space-y-2 text-[14px] leading-relaxed text-foreground/90 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  )
}
