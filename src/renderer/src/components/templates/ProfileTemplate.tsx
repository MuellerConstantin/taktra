import { Outlet } from 'react-router'
import { useProfiles } from '../../hooks/useProfiles'
import WelcomeView from '../../views/WelcomeView'

export function ProfileTemplate(): React.JSX.Element {
  const { activeProfile } = useProfiles()

  return activeProfile?.isAvailable ? <Outlet /> : <WelcomeView />
}
