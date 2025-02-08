import React, { useState } from 'react';
import { ServiceDetailsScreen } from './ServiceDetailsScreen';
import { AddServiceForm } from './AddServiceForm';
import { ServicesTable } from './ServicesTable';
import './ManageServices.css';


import { useContext } from 'react';
import { SubscriptionContext } from '../../context/SubscriptionContext';

interface ManageServicesScreenProps {
    organizationId: string;
}

export const ManageServicesScreen: React.FC<ManageServicesScreenProps> = ({organizationId}) => {
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const { isExpired } = useContext(SubscriptionContext);

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
                    <div className="create-button-container">
                        <button
                            className={`create-button ${isExpired ? 'disabled' : ''}`}
                            onClick={() => setShowServiceForm(true)}
                            disabled={!organizationId || isExpired}
                        >
                            Add Service
                        </button>
                        {isExpired && (
                            <div className="expired-message">
                                Subscription renewal required to add new services
                            </div>
                        )}
                    </div>
                </div>
                <ServicesTable
                    onNavigateToDetails={(serviceId) => setSelectedServiceId(serviceId)}
                />
            </div>
        );
    };

    return renderContent();
};
