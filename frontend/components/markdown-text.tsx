import { memo } from 'react'

interface Props {
  content: string
  className?: string
}

function parseInline(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code`
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(<em key={match.index} className="italic">{match[3]}</em>)
    } else if (match[4]) {
      parts.push(<code key={match.index} className="bg-secondary/80 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono">{match[4]}</code>)
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

function MarkdownText({ content, className = '' }: Props) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading ##
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-foreground mt-4 mb-1.5">
          {parseInline(line.slice(3))}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-extrabold text-foreground mt-4 mb-2">
          {parseInline(line.slice(2))}
        </h1>
      )
    }
    // Blockquote >
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary/40 pl-3 text-muted-foreground text-xs italic mt-2">
          {parseInline(line.slice(2))}
        </blockquote>
      )
    }
    // Bullet list: -, •, *
    else if (/^[-•*]\s/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-•*]\s/.test(lines[i])) {
        items.push(
          <li key={i} className="flex items-start gap-2">
            <span className="text-primary/60 mt-0.5 shrink-0">•</span>
            <span>{parseInline(lines[i].slice(2))}</span>
          </li>
        )
        i++
      }
      elements.push(<ul key={`ul-${i}`} className="space-y-1 my-1">{items}</ul>)
      continue
    }
    // Numbered list: 1. 2. etc
    else if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = []
      let n = 1
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="flex items-start gap-2">
            <span className="text-primary font-bold shrink-0 min-w-[1.2rem]">{n}.</span>
            <span>{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</span>
          </li>
        )
        i++
        n++
      }
      elements.push(<ol key={`ol-${i}`} className="space-y-1 my-1">{items}</ol>)
      continue
    }
    // Horizontal rule ---
    else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="border-border/30 my-3" />)
    }
    // Empty line = spacing
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    }
    // Normal paragraph
    else {
      elements.push(
        <p key={i} className="leading-relaxed">
          {parseInline(line)}
        </p>
      )
    }

    i++
  }

  return (
    <div className={`text-sm space-y-0.5 ${className}`}>
      {elements}
    </div>
  )
}

export default memo(MarkdownText)
