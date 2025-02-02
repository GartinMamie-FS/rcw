import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, orderBy, getDocs} from 'firebase/firestore';
import './PeerServicesSection.css';

interface Service {
    name: string;
}

interface PeerServiceWithId {
    id: string;
    service: Service;
}

export const PeerServicesSection: React.FC<{
    participantId: string;
    onEditClick: () => void;
}> = ({ participantId, onEditClick }) => {
    const { organizationId } = useOrganization();
    const [services, setServices] = useState<PeerServiceWithId[]>([]);

    useEffect(() => {
        const fetchServices = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const servicesQuery = query(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantServices'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(servicesQuery);
            const servicesData = snapshot.docs.flatMap(doc => {
                const servicesList = doc.data().services || [];
                return servicesList.map((serviceMap: any) => ({
                    id: serviceMap.serviceId,
                    service: { name: serviceMap.serviceName }
                }));
            });

            setServices(servicesData);
        };


        fetchServices();
    }, [participantId, organizationId]);

    return (
        <div className="peer-services-section">
            <div className="section-header">
                <h3>Peer Engaged Services</h3>
                <button
                    onClick={onEditClick}
                    className="add-button"
                    disabled={!organizationId}
                >
                    Add Service
                </button>
            </div>

            <div className="services-list">
                {services.map(service => (
                    <div key={service.id} className="service-item">
                        <span>{service.service.name}</span>
                        <div className="status-box">
                            <span>Yes</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
