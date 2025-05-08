'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { isLoggedIn, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        } else if (requireAdmin && !isAdmin) {
            router.push('/dashboard');
        }
    }, [isLoggedIn, isAdmin, requireAdmin, router]);

    if (!isLoggedIn || (requireAdmin && !isAdmin)) {
        return null;
    }

    return <>{children}</>;
} 