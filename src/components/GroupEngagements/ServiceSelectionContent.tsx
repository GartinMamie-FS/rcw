import React, { useState } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import './GroupEngagements.css';

interface ServiceSelectionProps {
    services: string[];
    onServiceSelected: (service: string) => void;
}

export const ServiceSelectionContent: React.FC<ServiceSelectionProps> = ({ services, onServiceSelected }) => {
    const { organizationId } = useOrganization();
    const [selectedService, setSelectedService] = useState<string>('');

    const handleNext = () => {
        if (organizationId && selectedService) {
            onServiceSelected(selectedService);
        }
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
                {services.map(service => (
                    <option key={service} value={service}>
                        {service}
                    </option>
                ))}
            </select>
            <button
                onClick={handleNext}
                disabled={!selectedService || !organizationId}
                className="next-button"
            >
                Next
            </button>
        </div>
    );
};
