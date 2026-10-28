'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Highlight, themes } from 'prism-react-renderer'
import { useEffect, useMemo, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'

type JsonCodeBlockProps = {
  value: unknown
  className?: string
}

export default function JsonCodeBlock({ value, className }: JsonCodeBlockProps) {
  const code = useMemo(() => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return ''
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2)
      } catch {
        return trimmed
      }
    }

    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }

    return value == null ? '' : String(value)
  }, [value])

  const { resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function handleCopy() {
    if (!code) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        return
      }
    } catch {}
    setCopied(false)
  }

  const copyLabel = copied ? translate('copied.label') : translate('messages.copy')

  return (
    <div className="group/code relative">
      <Highlight code={code} language="json" theme={resolvedTheme === 'dark' ? themes.vsDark : themes.github}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(highlightClassName, className, 'font-mono')}
            style={{
              ...style,
              margin: 0,
              padding: '0.75rem 3rem 0.75rem 1rem',
              overflowX: 'auto',
              borderRadius: '0.5rem',
              background: 'transparent',
              color: style.color ?? 'inherit',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
            }}
          >
            {tokens.map((line, i) => {
              const { ...lineProps } = getLineProps({ line })
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, key) => {
                    const { ...tokenProps } = getTokenProps({ token })
                    return <span key={key} {...tokenProps} />
                  })}
                </div>
              )
            })}
          </pre>
        )}
      </Highlight>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => handleCopy()}
        title={copyLabel}
        aria-label={copyLabel}
        className="absolute top-2 right-2 bg-background/80 text-muted-foreground backdrop-blur-sm hover:text-foreground"
      >
        {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      </Button>
    </div>
  )
}
