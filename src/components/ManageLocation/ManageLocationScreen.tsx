import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, getDoc} from 'firebase/firestore';
import './ManageLocationScreen.css';
import { LocationForm } from './LocationForm';
import { useContext } from 'react';
import { SubscriptionContext } from '../../context/SubscriptionContext';

interface Location {
    name: string;
    organizationId: string;
}

interface LocationWithId {
    id: string;
    location: Location;
}

interface ManageLocationsScreenProps {
    organizationId: string;
}

export const ManageLocationsScreen: React.FC<ManageLocationsScreenProps> = ({ organizationId }) => {
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const { isExpired } = useContext(SubscriptionContext);

    const renderContent = () => {
        if (showLocationForm) {
            return (
                <LocationForm
                    organizationId={organizationId}
                    onSaveComplete={() => setShowLocationForm(false)}
                />
            );
        }

        if (selectedLocationId) {
            return (
                <LocationDetailsScreen
                    organizationId={organizationId}
                    locationId={selectedLocationId}
                    onBack={() => setSelectedLocationId(null)}
                />
            );
        }

        return (
            <div className="manage-locations-screen">
                <div className="header-container">
                    <h2>Manage Locations</h2>
                    <div className="create-button-container">
                        <button
                            className={`create-button ${isExpired ? 'disabled' : ''}`}
                            onClick={() => setShowLocationForm(true)}
                            disabled={isExpired}
                        >
                            Create New Location
                        </button>
                        {isExpired && (
                            <div className="expired-message">
                                Subscription renewal required to create new locations
                            </div>
                        )}
                    </div>
                </div>
                <LocationsTable
                    organizationId={organizationId}
                    onNavigateToDetails={(locationId) => setSelectedLocationId(locationId)}
                />
            </div>
        );
    };

    return renderContent();
};


interface LocationsTableProps {
    organizationId: string;
    onNavigateToDetails: (locationId: string) => void;
}

const LocationsTable: React.FC<LocationsTableProps> = ({ organizationId, onNavigateToDetails }) => {
    const [locations, setLocations] = useState<LocationWithId[]>([]);

    useEffect(() => {
        const loadLocations = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const locationsRef = collection(db, 'organizations', organizationId, 'locations');
            const snapshot = await getDocs(locationsRef);
            const locationsList = snapshot.docs.map(doc => ({
                id: doc.id,
                location: doc.data() as Location
            }));
            setLocations(locationsList);
        };

        loadLocations();
    }, [organizationId]);

    return (
        <div className="manage-locations-screen">
            <div className="locations-table">
                <div className="table-header">
                    <span>Location</span>
                    <span>Action</span>
                </div>
                {locations.map(loc => (
                    <div key={loc.id} className="table-row">
                        <span>{loc.location.name}</span>
                        <button
                            onClick={() => onNavigateToDetails(loc.id)}
                            className="view-button"
                        >
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

};



interface LocationDetailsScreenProps {
    locationId: string;
    organizationId: string;
    onBack: () => void;
}

export const LocationDetailsScreen: React.FC<LocationDetailsScreenProps> = ({
                                                                                locationId,
                                                                                organizationId,
                                                                                onBack
                                                                            }) => {
    const [location, setLocation] = useState<LocationWithId | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [locationName, setLocationName] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const loadLocation = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const docRef = doc(db, 'organizations', organizationId, 'locations', locationId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const locationData = docSnap.data() as Location;
                setLocation({
                    id: docSnap.id,
                    location: locationData
                });
                setLocationName(locationData.name);
            }
        };

        loadLocation();
    }, [locationId, organizationId]);

    const handleSave = async () => {
        if (!location || !organizationId) return;

        const db = getFirestore();
        const locationRef = doc(db, 'organizations', organizationId, 'locations', location.id);
        await updateDoc(locationRef, {
            name: locationName,
            createdAt: new Date()
        });

        // Update participant locations if needed
        const participantsRef = collection(db, 'organizations', organizationId, 'participants');
        const participantsSnapshot = await getDocs(participantsRef);

        for (const participantDoc of participantsSnapshot.docs) {
            const locationsRef = collection(participantsRef, participantDoc.id, 'participantLocation');
            const locationsSnapshot = await getDocs(locationsRef);

            for (const locationDoc of locationsSnapshot.docs) {
                if (locationDoc.data().location === location.location.name) {
                    await updateDoc(locationDoc.ref, {
                        location: locationName
                    });
                }
            }
        }

        setIsEditing(false);
        setLocation({
            ...location,
            location: { name: locationName, organizationId }
        });
    };

    const handleDelete = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        await deleteDoc(doc(db, 'organizations', organizationId, 'locations', locationId));
        setShowDeleteDialog(false);
        onBack();
    };

    return (
        <div className="manage-locations-screen">
            <div className="header">
                <button onClick={onBack} className="back-button">
                    ← Back
                </button>
                <h2>{isEditing ? 'Edit Location' : 'Location Details'}</h2>
            </div>

            {location && (
                <>
                    {isEditing ? (
                        <>
                            <div className="form-group">
                                <label>Location Name</label>
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="button-container">
                                <button onClick={handleSave} className="form-button">
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="form-button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Location Name</label>
                                <div className="form-value">{location.location.name}</div>
                            </div>

                            <div className="button-container">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="form-button"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="form-button delete"
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {showDeleteDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete this location?</p>
                        <div className="dialog-buttons">
                            <button onClick={handleDelete} className="form-button delete">
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
