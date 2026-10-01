import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { Outlet, useLocation } from 'react-router'
import { useTranslations } from 'use-intl'
import { ViewHeader } from '../../components/molecules/ViewHeader'

const sections = [{ path: '/settings/appearance', labelKey: 'appearance' }] as const

function SettingsView(): React.JSX.Element {
  const t = useTranslations('SettingsView')
  const { pathname } = useLocation()

  return (
    <Tabs selectedKey={pathname} className="flex h-full flex-col">
      <ViewHeader title={t('title')}>
        <TabList aria-label={t('title')} className="flex gap-4">
          {sections.map(({ path, labelKey }) => (
            <Tab
              key={path}
              id={path}
              href={path}
              className="cursor-default border-b-2 border-transparent pb-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground selected:border-primary selected:font-medium selected:text-foreground"
            >
              {t(labelKey)}
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

export default SettingsView
