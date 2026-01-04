import { useAuth0 } from "@auth0/auth0-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export default function Auth0User() {
	const { isAuthenticated, isLoading, loginWithRedirect, logout, user } =
		useAuth0();

	if (isLoading) {
		return <p className="text-sm text-gray-300">Loading auth...</p>;
	}

	if (!isAuthenticated) {
		return (
			<Button
				variant="secondary"
				onClick={() => loginWithRedirect({ appState: { returnTo: "/" } })}
			>
				Sign in
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<div className="flex items-center gap-2 rounded-lg bg-gray-700/60 px-3 py-2">
				<Avatar className="h-8 w-8">
					<AvatarImage src={user?.picture} alt={user?.name} />
					<AvatarFallback>
						{user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}
					</AvatarFallback>
				</Avatar>
				<div className="text-left">
					<p className="text-sm font-medium text-white">{user?.name}</p>
					<p className="text-xs text-gray-300">{user?.email}</p>
				</div>
			</div>
			<Button
				variant="secondary"
				onClick={() =>
					logout({ logoutParams: { returnTo: window.location.origin } })
				}
			>
				Sign Out
			</Button>
		</div>
	);
}
