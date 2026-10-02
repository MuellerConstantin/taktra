import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { Outlet, useLocation } from 'react-router'
import { ViewHeader } from '../molecules/ViewHeader'

export interface TabViewSection {
  readonly path: string
  readonly label: string
}

interface TabViewTemplateProps {
  readonly title: string
  readonly subtitle?: string
  readonly sections: readonly TabViewSection[]
}

export function TabViewTemplate({
  title,
  subtitle,
  sections
}: TabViewTemplateProps): React.JSX.Element {
  const { pathname } = useLocation()

  return (
    <Tabs selectedKey={pathname} className="flex h-full flex-col">
      <ViewHeader title={title} subtitle={subtitle}>
        <TabList aria-label={title} className="flex gap-4">
          {sections.map(({ path, label }) => (
            <Tab
              key={path}
              id={path}
              href={path}
              className="cursor-default border-b-2 border-transparent pb-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground selected:border-primary selected:font-medium selected:text-foreground"
            >
              {label}
            </Tab>
          ))}
        </TabList>
      </ViewHeader>
      <TabPanel id={pathname} className="flex-1 overflow-y-auto px-8 py-6 outline-none">
        <Outlet />
      </TabPanel>
    </Tabs>
  )
}
