'use client'

/* AutoLink — renders plain text with URLs turned into clickable links. */

import React from 'react'

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g

/**
 * Renders a string with any http(s) URLs turned into clickable <a> links.
 * Preserves whitespace / newlines via `whitespace-pre-wrap` on the wrapper.
 */
export function AutoLink({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // reset lastIndex between renders (module-level regex)
  URL_REGEX.lastIndex = 0

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const url = match[0]
    nodes.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all transition-opacity hover:opacity-75"
        style={{ color: 'var(--primary)' }}
        onClick={e => e.stopPropagation()}
      >
        {url}
      </a>
    )
    lastIndex = match.index + url.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return <span className={className}>{nodes}</span>
}
