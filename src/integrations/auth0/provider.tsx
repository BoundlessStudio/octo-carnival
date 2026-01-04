import { Auth0Provider } from '@auth0/auth0-react'
import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

type ProviderProps = {
  children: React.ReactNode
}

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

if (!domain || !clientId) {
  throw new Error('Add your Auth0 domain and client id to the .env.local file')
}

export default function Auth0ProviderWithRouter({ children }: ProviderProps) {
  const navigate = useNavigate()
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : undefined

  const authorizationParams = useMemo(
    () => ({
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      ...(audience ? { audience } : {}),
    }),
    [redirectUri],
  )

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={authorizationParams}
      onRedirectCallback={(appState) => {
        if (appState?.returnTo) {
          navigate({ to: appState.returnTo as never })
        }
      }}
    >
      {children}
    </Auth0Provider>
  )
}
