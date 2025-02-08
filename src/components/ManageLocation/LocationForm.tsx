import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import './LocationForm.css';

interface LocationFormProps {
    organizationId: string;
    onSaveComplete: () => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({ onSaveComplete, organizationId }) => {
    const [locationName, setLocationName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const db = getFirestore();

        // Create location in the organizations/{orgId}/locations subcollection
        await addDoc(collection(db, 'organizations', organizationId, 'locations'), {
            name: locationName,
            createdAt: new Date()
        });

        onSaveComplete();
    };

    return (
        <div className="location-form-component">
            <h2>Create New Location</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Location Name</label>
                    <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Enter location name"
                        className="form-input"
                    />
                </div>

                <div className="button-container">
                    <button
                        type="submit"
                        className="form-button"
                        disabled={!locationName.trim() || !organizationId}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onSaveComplete}
                        className="form-button"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
