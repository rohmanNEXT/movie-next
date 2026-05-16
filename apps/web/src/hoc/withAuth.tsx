import React, { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useAuthStore } from '@/store/feature/auth';

/**
 * Route guard HOC — wraps a page component to require authentication.
 * Redirects to /login if no JWT token is present.
 */
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AuthenticatedComponent = (props: P) => {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
      if (!token || !user) {
        router.replace('/login');
      }
    }, [token, user, router]);

    if (!token || !user) return null;

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName =
    `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthenticatedComponent;
};

export default withAuth;
