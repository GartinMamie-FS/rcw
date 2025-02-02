import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { format } from 'date-fns';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp} from 'firebase/firestore';
import './UpdatePeerLocation.css';

interface Location {
    name: string;
    organizationId: string;
}

interface LocationWithId {
    id: string;
    location: Location;
}

export const UpdatePeerLocation: React.FC<{
    participantId: string;
    onSaveComplete: () => void;
}> = ({ participantId, onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [selectedLocation, setSelectedLocation] = useState('');
    const [availableLocations, setAvailableLocations] = useState<LocationWithId[]>([]);
    const currentDate = format(new Date(), 'MM/dd/yyyy');

    useEffect(() => {
        const fetchLocations = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const locationsRef = collection(db, 'organizations', organizationId, 'locations');
            const snapshot = await getDocs(locationsRef);
            const locationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                location: doc.data() as Location
            }));
            setAvailableLocations(locationsData);
        };

        fetchLocations();
    }, [organizationId]);

    const handleSave = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        const locationData = {
            location: selectedLocation,
            createdAt: serverTimestamp(),
            engagementDate: currentDate,
            engagementChannel: ''
        };

        await addDoc(
            collection(db, 'organizations', organizationId, 'participants', participantId, 'participantLocation'),
            locationData
        );

        onSaveComplete();
    };

    return (
        <div className="update-location">
            <h3>Select New Location</h3>

            <div className="location-options">
                {availableLocations.map(locationWithId => (
                    <div key={locationWithId.id} className="location-option">
                        <input
                            type="radio"
                            id={locationWithId.id}
                            name="location"
                            value={locationWithId.location.name}
                            checked={selectedLocation === locationWithId.location.name}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            disabled={!organizationId}
                        />
                        <label htmlFor={locationWithId.id}>
                            {locationWithId.location.name}
                        </label>
                    </div>
                ))}
            </div>

            <div className="button-group">
                <button
                    onClick={handleSave}
                    disabled={!selectedLocation || !organizationId}
                    className="save-button"
                >
                    Save
                </button>
                <button
                    onClick={onSaveComplete}
                    className="cancel-button"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
