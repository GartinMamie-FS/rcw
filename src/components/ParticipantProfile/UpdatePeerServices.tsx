import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { format } from 'date-fns';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import './UpdatePeerServices.css';

interface Service {
    name: string;
    organizationId: string;
}

interface ServiceWithId {
    id: string;
    service: Service;
}

export const UpdatePeerServices: React.FC<{
    participantId: string;
    onComplete: () => void;
}> = ({ participantId, onComplete }) => {
    const { organizationId } = useOrganization();
    const [services, setServices] = useState<ServiceWithId[]>([]);
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadServices = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const servicesRef = collection(db, 'organizations', organizationId, 'services');
            const snapshot = await getDocs(servicesRef);
            const servicesData = snapshot.docs.map(doc => ({
                id: doc.id,
                service: doc.data() as Service
            }));
            setServices(servicesData);
        };

        loadServices();
    }, [organizationId]);

    const handleSave = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        const serviceData = {
            createdAt: serverTimestamp(),
            services: Array.from(selectedServices).map(serviceId => {
                const service = services.find(s => s.id === serviceId)?.service;
                return {
                    serviceId,
                    serviceName: service?.name || ''
                };
            })
        };

        await addDoc(
            collection(db, 'organizations', organizationId, 'participants', participantId, 'participantServices'),
            serviceData
        );

        await setDoc(
            doc(db, 'organizations', organizationId, 'participants', participantId, 'lastEngagement', 'current'),
            {
                date: format(new Date(), 'MM/dd/yyyy'),
                type: 'services',
                updatedAt: serverTimestamp()
            }
        );

        onComplete();
    };

    return (
        <div className="update-services">
            <h3>Participant Services</h3>
            <p className="subtitle">Select all services that apply to this participant</p>

            <div className="services-list">
                {services.map(serviceWithId => (
                    <div key={serviceWithId.id} className="service-item">
                        <input
                            type="checkbox"
                            id={serviceWithId.id}
                            checked={selectedServices.has(serviceWithId.id)}
                            onChange={(e) => {
                                const newSelected = new Set(selectedServices);
                                if (e.target.checked) {
                                    newSelected.add(serviceWithId.id);
                                } else {
                                    newSelected.delete(serviceWithId.id);
                                }
                                setSelectedServices(newSelected);
                            }}
                            disabled={!organizationId}
                        />
                        <label htmlFor={serviceWithId.id}>
                            {serviceWithId.service.name}
                        </label>
                    </div>
                ))}
            </div>

            <button
                className="save-button"
                onClick={handleSave}
                disabled={selectedServices.size === 0 || !organizationId}
            >
                Save
            </button>
        </div>
    );
};
