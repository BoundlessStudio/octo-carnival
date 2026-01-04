import { Link } from '@tanstack/react-router'

import Auth0User from './auth0-user'

export default function Header() {

  return (
    <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
      <h1 className="ml-4 text-xl font-semibold">
        <Link to="/">
          <img
            src="/tanstack-word-logo-white.svg"
            alt="TanStack Logo"
            className="h-10"
          />
        </Link>
      </h1>
      <div className="flex flex-1 items-center justify-end gap-6">
        <Link to="/ai" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
          AI Studio
        </Link>
        <Auth0User />
      </div>
    </header>
  )
}
