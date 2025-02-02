import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, serverTimestamp} from 'firebase/firestore';
import { format } from 'date-fns';
import { useOrganization } from '../../context/OrganizationContext';

interface SessionInformationFormProps {
    participantId: string;
    onComplete: () => void;
    organizationId: string;  // Add this line
}


interface LocationItem {
    id: string;
    name: string;
    address: string;
    organizationId: string;
}

export const SessionInformationForm: React.FC<SessionInformationFormProps> = ({ participantId, onComplete }) => {
    const { organizationId } = useOrganization();
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [engagementDate, setEngagementDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (organizationId) {
            loadLocations();
        }
    }, [organizationId]);

    const loadLocations = async () => {
        const db = getFirestore();
        const locationsRef = collection(db, 'organizations', organizationId, 'locations');
        const snapshot = await getDocs(locationsRef);
        const locationsList = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            address: doc.data().address,
            organizationId: organizationId
        }));
        setLocations(locationsList);
    };

    const saveSessionInfo = async () => {
        const db = getFirestore();

        const locationData = {
            location: selectedLocation,
            engagementDate,
            createdAt: serverTimestamp()
        };

        await addDoc(
            collection(db, 'organizations', organizationId, 'participants', participantId, 'participantLocation'),
            locationData
        );

        const lastEngagementData = {
            date: format(new Date(engagementDate), 'MM/dd/yyyy'),
            type: 'location',
            updatedAt: serverTimestamp()
        };

        await setDoc(
            doc(db, 'organizations', organizationId, 'participants', participantId, 'lastEngagement', 'current'),
            lastEngagementData
        );

        onComplete();
    };

    return (
        <div className="session-form">
            <h2>Session Information</h2>
            <p className="required-text">* indicates required field</p>

            <div className="form-section">
                <h3>Select and assign Location</h3>
                <p>Assign Location for session engagement.</p>

                <div className="form-group">
                    <div className="custom-select">
                        <div
                            className="select-header"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span>{selectedLocation || 'Select Location *'}</span>
                            <span className={`arrow ${isDropdownOpen ? 'up' : 'down'}`}>▼</span>
                        </div>
                        {isDropdownOpen && (
                            <div className="select-options">
                                {locations.map(location => (
                                    <div
                                        key={location.id}
                                        className="select-option"
                                        onClick={() => {
                                            setSelectedLocation(location.name);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {location.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label>Engagement Date *</label>
                    <input
                        type="date"
                        value={engagementDate}
                        onChange={(e) => setEngagementDate(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            <button
                className="save-button"
                disabled={!selectedLocation}
                onClick={saveSessionInfo}
            >
                Save
            </button>
        </div>
    );
};