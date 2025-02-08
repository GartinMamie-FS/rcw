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
import './AddNotes.css';

interface StaffMember {
    id: string;
    name: string;
}

interface LocationWithId {
    id: string;
    location: {
        name: string;
    };
}

interface PeerServiceWithId {
    id: string;
    service: {
        name: string;
    };
}

interface AddNotesProps {
    participantId: string;
    onSaveComplete: () => void;
}

export const AddNotes: React.FC<AddNotesProps> = ({ participantId, onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations, setLocations] = useState<LocationWithId[]>([]);
    const [completionDate, setCompletionDate] = useState(
        format(new Date(), 'MM/dd/yyyy')
    );
    const [staffNote, setStaffNote] = useState('');
    const [currentSection, setCurrentSection] = useState('Notes Information');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [availableServices, setAvailableServices] = useState<PeerServiceWithId[]>([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [staffList, setStaffList] = useState<StaffMember[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!organizationId) return;

            const db = getFirestore();

            // Load locations
            const locationRef = collection(db, 'organizations', organizationId, 'locations');
            const locationSnapshot = await getDocs(locationRef);
            const locationsData = locationSnapshot.docs.map(doc => ({
                id: doc.id,
                location: doc.data() as { name: string }
            }));
            setLocations(locationsData);

            // Load staff members
            const staffRef = collection(db, 'organizations', organizationId, 'users');
            const staffSnapshot = await getDocs(staffRef);
            const staffData = staffSnapshot.docs
                .filter(doc => ['admin', 'staff'].includes(doc.data().role))
                .map(doc => ({
                    id: doc.id,
                    name: `${doc.data().firstName} ${doc.data().lastName}`
                }));
            setStaffList(staffData);

            // Load services
            const servicesRef = collection(db, 'organizations', organizationId, 'services');
            const servicesSnapshot = await getDocs(servicesRef);
            const servicesData = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                service: doc.data() as { name: string }
            }));
            setAvailableServices(servicesData);
        };

        fetchData();
    }, [organizationId]);

    const handleSaveAll = async () => {
        if (!organizationId) return;

        const db = getFirestore();

        // Convert completion date string to Date object
        const completionDateObj = new Date(completionDate);

        // Save services data with completion date
        const servicesData = {
            services: selectedServices.map(serviceId => ({
                serviceId,
                serviceName: availableServices.find(s => s.id === serviceId)?.service.name || ''
            })),
            createdAt: completionDateObj,
            date: completionDate
        };

        await addDoc(
            collection(db, 'organizations', organizationId, 'participants', participantId, 'participantServices'),
            servicesData
        );

        // Save note data
        const noteData = {
            location: selectedLocation,
            completionDate,
            staffNote,
            staffName: selectedStaff,
            createdAt: serverTimestamp()
        };

        await addDoc(
            collection(db, 'organizations', organizationId, 'participants', participantId, 'participantNotes'),
            noteData
        );

        // Update lastEngagement
        await setDoc(
            doc(db, 'organizations', organizationId, 'participants', participantId, 'lastEngagement', 'current'),
            {
                date: completionDate,
                type: 'note',
                updatedAt: serverTimestamp()
            }
        );

        onSaveComplete();
    };



    return (
        <div className="add-notes">
            <div className="notes-layout">
                {/* Navigation Panel */}
                <div className="nav-panel">
                    <h3>Peer Notes</h3>
                    <div className="nav-links">
                        <button
                            onClick={() => setCurrentSection('Notes Information')}
                            className={currentSection === 'Notes Information' ? 'active' : ''}
                            disabled={!organizationId}
                        >
                            Notes Information
                        </button>
                        <button
                            onClick={() => setCurrentSection('Peer Services')}
                            className={currentSection === 'Peer Services' ? 'active' : ''}
                            disabled={!organizationId}
                        >
                            Peer Services
                        </button>
                        <button
                            onClick={() => setCurrentSection('Peer Notes')}
                            className={currentSection === 'Peer Notes' ? 'active' : ''}
                            disabled={!organizationId}
                        >
                            Peer Notes
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-area">
                    <h3>Form Information</h3>

                    {currentSection === 'Notes Information' && (
                        <div className="section">
                            <p className="required-text">* indicates required field</p>

                            <div className="form-group">
                                <label>Select and assign Location</label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    disabled={!organizationId}
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.location.name}>
                                            {loc.location.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Select Staff Member *</label>
                                <select
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    disabled={!organizationId}
                                >
                                    <option value="">Select Staff</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.name}>
                                            {staff.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Form completion date *</label>
                                <input
                                    type="text"
                                    value={completionDate}
                                    onChange={(e) => setCompletionDate(e.target.value)}
                                    disabled={!organizationId}
                                />
                            </div>

                            <button
                                onClick={() => setCurrentSection('Peer Services')}
                                className="continue-button"
                                disabled={!organizationId}
                            >
                                Continue
                            </button>
                        </div>
                    )}


                    {currentSection === 'Peer Services' && (
                        <div className="section">
                            <h4>Select Peer Services</h4>
                            <div className="services-list">
                                {availableServices.map(service => (
                                    <div key={service.id} className="service-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedServices.includes(service.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedServices([...selectedServices, service.id]);
                                                } else {
                                                    setSelectedServices(selectedServices.filter(id => id !== service.id));
                                                }
                                            }}
                                            disabled={!organizationId}
                                        />
                                        <label>{service.service.name}</label>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentSection('Peer Notes')}
                                className="continue-button"
                                disabled={!organizationId}
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {currentSection === 'Peer Notes' && (
                        <div className="section">
                            <p className="required-text">* indicates required field</p>
                            <div className="form-group">
                                <label>Staff note for participant</label>
                                <textarea
                                    value={staffNote}
                                    onChange={(e) => setStaffNote(e.target.value)}
                                    rows={10}
                                    disabled={!organizationId}
                                />
                            </div>
                            <button
                                onClick={handleSaveAll}
                                className="continue-button"
                                disabled={!organizationId}
                            >
                                Save All
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
