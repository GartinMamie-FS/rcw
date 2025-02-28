import React, { createContext, useContext, useState } from 'react';

interface OrganizationContextType {
    organizationId: string;
    setOrganizationId: (id: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [organizationId, setOrganizationId] = useState(() => {
        return localStorage.getItem('currentOrganizationId') || '';
    });

    const updateOrganizationId = (id: string) => {
        localStorage.setItem('currentOrganizationId', id);
        setOrganizationId(id);
    };

    return (
        <OrganizationContext.Provider value={{ organizationId, setOrganizationId: updateOrganizationId }}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};
