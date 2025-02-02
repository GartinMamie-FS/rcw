import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, orderBy, limit, getDocs} from 'firebase/firestore';
import './PeerLocationSection.css';

export const PeerLocationSection: React.FC<{
    participantId: string;
    onEditClick: () => void;
}> = ({ participantId, onEditClick }) => {
    const { organizationId } = useOrganization();
    const [currentLocation, setCurrentLocation] = useState('');

    useEffect(() => {
        const fetchLocation = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const locationQuery = query(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantLocation'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(locationQuery);
            if (!snapshot.empty) {
                setCurrentLocation(snapshot.docs[0].data().location || '');
            }
        };


        fetchLocation();
    }, [participantId, organizationId]);

    return (
        <div className="peer-location-section">
            <div className="section-header">
                <h3>Current Location</h3>
                <button
                    onClick={onEditClick}
                    className="edit-button"
                    disabled={!organizationId}
                >
                    Change Location
                </button>
            </div>

            <div className="location-info">
                <p>Location: {currentLocation}</p>
            </div>
        </div>
    );
};
