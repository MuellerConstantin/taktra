import { RiArrowDownSLine, RiArrowUpSLine } from '@remixicon/react'
import { useLayoutEffect, useRef, useState } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { twMerge } from 'tailwind-merge'
import { useTranslations } from 'use-intl'
import { noteElements, noteLinkProtocols, noteRemarkPlugins } from '../../../../shared/notes'
import { Button } from '../atoms/Button'

function isAllowedLink(href: string | undefined): boolean {
  if (!href) return false
  try {
    return noteLinkProtocols.includes(new URL(href).protocol)
  } catch {
    return false
  }
}

const components: Components = {
  a: ({ href, children }) =>
    isAllowedLink(href) ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="cursor-default text-primary underline underline-offset-2"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    )
}

interface NoteProps {
  readonly text: string
  readonly className?: string
}

export function Note({ text, className }: NoteProps): React.JSX.Element {
  return (
    <div
      className={twMerge(
        'space-y-1 break-words [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
        className
      )}
    >
      <Markdown
        remarkPlugins={noteRemarkPlugins}
        allowedElements={noteElements}
        unwrapDisallowed
        components={components}
      >
        {text}
      </Markdown>
    </div>
  )
}

export function ExpandableNote({ text, className }: NoteProps): React.JSX.Element {
  const t = useTranslations('Note')
  const ref = useRef<HTMLDivElement>(null)
  const [isExpanded, setExpanded] = useState(false)
  const [isClamped, setClamped] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || isExpanded) return
    const observer = new ResizeObserver(() =>
      setClamped(element.scrollHeight > element.clientHeight)
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [isExpanded, text])

  return (
    <div className={twMerge('flex min-w-0 flex-col items-start', className)}>
      <div ref={ref} className={isExpanded ? 'w-full' : 'line-clamp-2 w-full'}>
        <Note text={text} />
      </div>
      {(isClamped || isExpanded) && (
        <Button
          variant="icon"
          aria-expanded={isExpanded}
          onPress={() => setExpanded(!isExpanded)}
          className="mt-0.5 -ml-1 gap-0.5 text-xs"
        >
          {isExpanded ? (
            <RiArrowUpSLine aria-hidden className="size-4" />
          ) : (
            <RiArrowDownSLine aria-hidden className="size-4" />
          )}
          {isExpanded ? t('showLess') : t('showMore')}
        </Button>
      )}
    </div>
  )
}
