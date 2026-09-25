'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isMarkdownDescriptionFormat } from '@/lib/resolverClient'

const MARKDOWN_CLASS = [
  '[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
  '[&_code]:font-mono [&_code]:text-[0.9em]',
  '[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold',
].join(' ')

type ClaimTextProps = {
  text: string
  format?: string
  className?: string
  title?: string
}

/**
 * Renders credential claim text as text or as Markdown, per [VFE-SEC-2].
 * The Markdown renderer keeps raw HTML inert, so remote content cannot run a script.
 */
export default function ClaimText({ text, format, className, title }: ClaimTextProps) {
  if (!isMarkdownDescriptionFormat(format)) {
    return (
      <p className={className} title={title}>
        {text}
      </p>
    )
  }

  return (
    <div className={className ? `${className} ${MARKDOWN_CLASS}` : MARKDOWN_CLASS} title={title}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
