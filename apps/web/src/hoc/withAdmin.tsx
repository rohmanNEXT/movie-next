import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuthStore } from '@/store/feature/auth';

const withAdmin = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AdminComponent = (props: P) => {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      // Redirect if not logged in or not admin
      if (mounted) {
        if (!user) {
          router.replace('/');
        } else if (user.role !== 'admin' && user.role !== 'superadmin') {
          router.replace('/');
        }
      }
    }, [user, router, mounted]);

    if (!mounted) return null;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

    return <WrappedComponent {...props} />;
  };

  AdminComponent.displayName =
    `withAdmin(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AdminComponent;
};

export default withAdmin;