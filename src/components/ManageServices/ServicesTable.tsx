import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs} from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import { Service, ServiceWithId } from './types';

interface ServicesTableProps {
    onNavigateToDetails: (serviceId: string) => void;
}

export const ServicesTable: React.FC<ServicesTableProps> = ({ onNavigateToDetails }) => {
    const { organizationId } = useOrganization();
    const [services, setServices] = useState<ServiceWithId[]>([]);

    useEffect(() => {
        const loadServices = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const servicesRef = collection(db, 'organizations', organizationId, 'services');
            const snapshot = await getDocs(servicesRef);
            const servicesList = snapshot.docs.map(doc => ({
                id: doc.id,
                service: {
                    name: doc.data().name,
                    createdAt: doc.data().createdAt
                } as Service
            }));
            setServices(servicesList);
        };

        loadServices();
    }, [organizationId]);

    return (
        <div className="services-table">
            <div className="table-header">
                <span>Service</span>
                <span>Action</span>
            </div>
            {services.map(srv => (
                <div key={srv.id} className="table-row">
                    <span>{srv.service.name}</span>
                    <button
                        onClick={() => onNavigateToDetails(srv.id)}
                        className="view-button"
                    >
                        View
                    </button>
                </div>
            ))}
        </div>
    );
};
