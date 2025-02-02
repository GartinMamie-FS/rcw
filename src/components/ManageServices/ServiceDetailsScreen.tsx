import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import { Service, ServiceWithId } from './types';
import './ServiceDetailsScreen.css';

interface ServiceDetailsProps {
    serviceId: string;
    onBack: () => void;
}

export const ServiceDetailsScreen: React.FC<ServiceDetailsProps> = ({ serviceId, onBack }) => {
    const { organizationId } = useOrganization();
    const [service, setService] = useState<ServiceWithId | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const loadService = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const docRef = doc(db, 'organizations', organizationId, 'services', serviceId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const serviceData = docSnap.data() as Service;
                setService({
                    id: docSnap.id,
                    service: serviceData
                });
            }
        };

        loadService();
    }, [serviceId, organizationId]);

    const handleDelete = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        await deleteDoc(doc(db, 'organizations', organizationId, 'services', serviceId));
        setShowDeleteDialog(false);
        onBack();
    };

    return (
        <div className="service-details">
            <div className="header">
                <button onClick={onBack} className="back-button">
                    ← Back
                </button>
                <h2>Service Details</h2>
            </div>

            {service && (
                <>
                    <div className="form-group">
                        <label>Service Name</label>
                        <div className="form-value">{service.service.name}</div>
                    </div>

                    <div className="button-container">
                        <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="form-button delete"
                            disabled={!organizationId}
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}

            {showDeleteDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete this service?</p>
                        <div className="dialog-buttons">
                            <button
                                onClick={handleDelete}
                                className="form-button delete"
                                disabled={!organizationId}
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="form-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
