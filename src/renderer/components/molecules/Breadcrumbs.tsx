import { RiArrowRightSLine } from '@remixicon/react'
import { Fragment } from 'react'
import { Link } from 'react-aria-components'

export interface BreadcrumbItem {
  readonly href: string
  readonly label: string
  readonly color?: string | null
}

interface BreadcrumbsProps {
  readonly items: readonly BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps): React.JSX.Element {
  return (
    <span className="flex min-w-0 items-center gap-1">
      {items.map(({ href, label, color }, index) => (
        <Fragment key={href}>
          {index > 0 && <RiArrowRightSLine aria-hidden className="size-3.5 shrink-0" />}
          <Link
            href={href}
            className="flex min-w-0 cursor-default items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {color !== undefined && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full bg-muted"
                style={color ? { backgroundColor: color } : undefined}
              />
            )}
            <span className="truncate">{label}</span>
          </Link>
        </Fragment>
      ))}
    </span>
  )
}
