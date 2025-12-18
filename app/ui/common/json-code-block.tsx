'use client';

import { useEffect, useMemo, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import IconLabelButton from './icon-label-button';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';

type JsonCodeBlockProps = {
  value: unknown;
  className?: string;
};

/**
 * Lightweight wrapper around prism-react-renderer to display JSON content
 * with syntax highlighting, similar to Docusaurus code blocks.
 */
export default function JsonCodeBlock({ value, className }: JsonCodeBlockProps) {

  const code = useMemo(() => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return trimmed;
      }
    }

    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return value == null ? '' : String(value);
  }, [value]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    if (!code) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        return;
      }
    } catch {
      // Swallow copy errors to avoid breaking the UI when clipboard is unavailable
    }
    setCopied(false);
  }

  return (
    <div className="relative">
      <Highlight code={code} language="json" theme={themes.github}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={[highlightClassName, className, 'bg-[#f6f8fa] dark:bg-slate-900 dark:text-slate-200']
              .filter(Boolean)
              .join(' ')}
            style={{
              ...style,
              margin: 0,
              padding: '0.75rem 1rem',
              overflowX: 'auto',
              borderRadius: '0.5rem',
              background: 'transparent',
              color: style.color ?? 'inherit',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {tokens.map((line, i) => {
              const { ...lineProps } = getLineProps({ line });
              return (
              <div key={i}  {...lineProps}>
                {line.map((token, key) => {
                  const { ...tokenProps } = getTokenProps({ token });
                  return (
                  <span key={key} {...tokenProps}/>
                )})}
              </div>
            )})}
          </pre>
        )}
      </Highlight>
      <IconLabelButton
        icon={copied? faCheck: faCopy}
        onClick={() => handleCopy()}
        title="Copy Address"
        className="absolute right-3 top-3"
      />
    </div>
  );
}
