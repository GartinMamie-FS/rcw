import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import './GroupEngagements.css';
import './ServiceSelectionContent.css'

interface Service {
    id: string;
    name: string;
}

interface ServiceSelectionProps {
    services: string[];
    onServiceSelected: (service: string) => void;
}

export const ServiceSelectionContent: React.FC<ServiceSelectionProps> = ({ onServiceSelected }) => {
    const {organizationId} = useOrganization();
    const [selectedService, setSelectedService] = useState<string>('');
    const [organizationServices, setOrganizationServices] = useState<Service[]>([]);

    useEffect(() => {
        const fetchServices = async () => {
            if (!organizationId) return;
            const db = getFirestore();
            const servicesRef = collection(db, 'organizations', organizationId, 'services');
            const servicesSnapshot = await getDocs(servicesRef);
            const servicesData = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setOrganizationServices(servicesData);
        };

        fetchServices();
    }, [organizationId]);

    const handleNext = () => {
        onServiceSelected(selectedService);
    }

    return (
        <div className="service-selection">
            <h3>Choose Service</h3>
            <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="service-dropdown"
            >
                <option value="">Select Service</option>
                {organizationServices.map(service => (
                    <option key={service.id} value={service.name}>
                        {service.name}
                    </option>
                ))}
            </select>
            <button
                onClick={handleNext}
                disabled={!selectedService}
                className="next-button"
            >
                Next
            </button>
        </div>
    );
};
