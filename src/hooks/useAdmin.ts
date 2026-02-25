import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { checkAdminStatus } from '../services/adminService';
import { AdminPrivileges } from '../types';
import { onAuthStateChanged } from 'firebase/auth';

export const useAdmin = () => {
    const [adminPrivileges, setAdminPrivileges] = useState<AdminPrivileges | null>(null);
    const [isAdminLoading, setIsAdminLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const privileges = await checkAdminStatus(user.uid);
                    setAdminPrivileges(privileges);
                } catch (error) {
                    console.error("Failed to check admin status", error);
                    setAdminPrivileges(null);
                }
            } else {
                setAdminPrivileges(null);
            }
            setIsAdminLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const hasRole = (role: string) => {
        if (!adminPrivileges) return false;
        // Super Admin has all Access
        if (adminPrivileges.roles.includes('SUPER_ADMIN')) return true;
        return adminPrivileges.roles.includes(role as any);
    };

    return {
        adminPrivileges,
        isAdminLoading,
        hasRole,
        isSuperAdmin: hasRole('SUPER_ADMIN')
    };
};
