import React, { useState } from 'react';
import { ServiceDetailsScreen } from './ServiceDetailsScreen';
import { AddServiceForm } from './AddServiceForm';
import { ServicesTable } from './ServicesTable';
import './ManageServices.css';

interface ManageServicesScreenProps {
    organizationId: string;
}
export const ManageServicesScreen: React.FC<ManageServicesScreenProps> = ({organizationId}) => {

    const [showServiceForm, setShowServiceForm] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

    const renderContent = () => {
        if (showServiceForm) {
            return (
                <AddServiceForm
                    onSaveComplete={() => setShowServiceForm(false)}
                />
            );
        }

        if (selectedServiceId) {
            return (
                <ServiceDetailsScreen
                    serviceId={selectedServiceId}
                    onBack={() => setSelectedServiceId(null)}
                />
            );
        }

        return (
            <div className="manage-services-screen">
                <div className="header-container">
                    <h2>Manage Services</h2>
                    <button
                        className="create-button"
                        onClick={() => setShowServiceForm(true)}
                        disabled={!organizationId}
                    >
                        Add Service
                    </button>
                </div>
                <ServicesTable
                    onNavigateToDetails={(serviceId) => setSelectedServiceId(serviceId)}
                />
            </div>
        );
    };

        return renderContent();
};
