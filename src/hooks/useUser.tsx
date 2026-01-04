import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

type UserOrNull = ReturnType<typeof useAuth0>["user"];

// redirects to the sign-in page if the user is not signed in
export const useUser = (): UserOrNull => {
	const { user, isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
	const location = useLocation();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			loginWithRedirect({ appState: { returnTo: location.pathname } });
		}
	}, [isAuthenticated, isLoading, loginWithRedirect, location.pathname]);

	return user;
};
