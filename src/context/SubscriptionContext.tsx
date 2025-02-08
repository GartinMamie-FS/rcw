import { createContext, useContext } from 'react';

interface SubscriptionContextType {
    isExpired: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContextType>({ isExpired: false });
export const useSubscription = () => useContext(SubscriptionContext);
