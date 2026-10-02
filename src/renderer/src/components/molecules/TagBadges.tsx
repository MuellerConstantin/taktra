import { Button, TooltipTrigger } from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { useTranslations } from 'use-intl'
import type { ActivityTag } from '../../../../shared/activities'
import { Badge } from '../atoms/Badge'
import { Tooltip } from '../atoms/Tooltip'

const MAX_VISIBLE = 5
const MAX_IN_TOOLTIP = 10

interface TagBadgesProps {
  readonly tags: readonly ActivityTag[]
  readonly className?: string
}

export function TagBadges({ tags, className }: TagBadgesProps): React.JSX.Element {
  const t = useTranslations('TagBadges')
  const hidden = tags.slice(MAX_VISIBLE)
  const inTooltip = hidden.slice(0, MAX_IN_TOOLTIP)
  const remaining = hidden.length - inTooltip.length

  return (
    <span className={twMerge('flex flex-wrap gap-1', className)}>
      {tags.slice(0, MAX_VISIBLE).map((tag) => (
        <Badge key={tag.id} color={tag.color}>
          {tag.name}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <TooltipTrigger delay={300}>
          <Button
            aria-label={t('more', { count: hidden.length })}
            className="cursor-default rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            +{hidden.length}
          </Button>
          <Tooltip className="max-w-xs">
            <span className="flex flex-wrap gap-1">
              {inTooltip.map((tag) => (
                <Badge key={tag.id} color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
              {remaining > 0 && <span className="self-center px-1">+{remaining}</span>}
            </span>
          </Tooltip>
        </TooltipTrigger>
      )}
    </span>
  )
}
