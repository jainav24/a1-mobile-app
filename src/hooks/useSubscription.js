import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useSubscription() {
    const { currentUser } = useAuth();
    const [plan, setPlan] = useState('free');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setPlan('free');
            setIsSubscribed(false);
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPlan(data.subscriptionPlan || 'free');
                setIsSubscribed(!!data.isSubscribed);
            } else {
                setPlan('free');
                setIsSubscribed(false);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching subscription data:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const isPremium = plan === 'premium' && isSubscribed === true;

    return {
        isPremium,
        plan,
        loading,
        canCreateProject: (currentProjectCount) => isPremium || currentProjectCount < 1,
        canUsePremiumAsset: () => isPremium,
        canAccessAIBot: () => isPremium,
    };
}
