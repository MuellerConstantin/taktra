import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

interface ParserData {
  micromarkExtensions?: unknown[]
}

/**
 * Notes are exported as their source text, so only syntax that reads well unrendered is
 * parsed. Everything else, such as headings or tables, stays literal text.
 */
function restrictNoteSyntax(this: { data(): object }): void {
  const data: ParserData = this.data()
  data.micromarkExtensions = [
    ...(data.micromarkExtensions ?? []),
    {
      disable: {
        null: [
          'blockQuote',
          'codeFenced',
          'codeIndented',
          'definition',
          'gfmFootnoteCall',
          'gfmFootnoteDefinition',
          'headingAtx',
          'htmlFlow',
          'htmlText',
          'labelStartImage',
          'setextUnderline',
          'table',
          'tasklistCheck',
          'thematicBreak'
        ]
      }
    }
  ]
}

/** Parser plugins for notes, shared by every place that renders them. */
export const noteRemarkPlugins = [remarkGfm, remarkBreaks, restrictNoteSyntax]

/** Safety net in case a parser update brings syntax that is not disabled above. */
export const noteElements = ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'del', 'code', 'a']

export const noteLinkProtocols = ['http:', 'https:', 'mailto:']
