import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import './Participants.css';

interface ParticipantsProps {
    onNewIntake: () => void;
    onViewParticipant: (id: string) => void;
    organizationId?: string;
}

interface Participant {
    id: string;
    firstName: string;
    lastName: string;
    location: string;
    lastEngagementDate: string;
    currentProgram: string;
    organizationId: string;
}

export const Participants: React.FC<ParticipantsProps> = ({ onNewIntake, onViewParticipant }) => {
    const {organizationId} = useOrganization();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (organizationId) {
            fetchParticipants();
        }
    }, [organizationId]);

    const fetchParticipants = async () => {
        const db = getFirestore();
        try {
            const participantsRef = collection(db, 'organizations', organizationId, 'participants');
            const participantsSnapshot = await getDocs(participantsRef);

            const participantsData = await Promise.all(participantsSnapshot.docs.map(async (doc) => {
                const participant = doc.data();

                const locationQuery = query(
                    collection(doc.ref, 'participantLocation'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const locationSnapshot = await getDocs(locationQuery);
                const location = locationSnapshot.docs[0]?.data()?.location || '';

                const programQuery = query(
                    collection(doc.ref, 'participantProgram'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const programSnapshot = await getDocs(programQuery);
                const programs = programSnapshot.docs[0]?.data()?.programs || [];
                const currentProgram = programs[0]?.programName || '';

                const lastEngagementDoc = await getDocs(collection(doc.ref, 'lastEngagement'));
                const lastEngagementDate = lastEngagementDoc.docs[0]?.data()?.date || '';

                return {
                    id: doc.id,
                    firstName: participant.firstName || '',
                    lastName: participant.lastName || '',
                    location,
                    lastEngagementDate,
                    currentProgram,
                    organizationId // Include organizationId from the current context
                };
            }));

            setParticipants(participantsData);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setIsLoading(false);
        }
    };


    const handleViewParticipant = (participantId: string) => {
        onViewParticipant(participantId);
    };

    const filteredParticipants = participants.filter(participant =>
        `${participant.firstName} ${participant.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    return (
        <div className="participants-container">
            <div className="participants-header">
                <h2>All Participants</h2>
                <button
                    className="new-intake-button"
                    onClick={onNewIntake}
                >
                    New Intake Session
                </button>
            </div>

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search Participant"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <button className="search-button">Search</button>
            </div>

            <div className="participants-table" data-component="participants-table">
                <div className="table-header">
                    <div className="header-cell">Participant Name</div>
                    <div className="header-cell">Location</div>
                    <div className="header-cell">Program</div>
                    <div className="header-cell">Last Engagement</div>
                    <div className="header-cell action">Action</div>
                </div>

                {isLoading ? (
                    <div className="loading">Loading participants...</div>
                ) : (
                    filteredParticipants.map(participant => (
                        <div key={participant.id} className="table-row">
                            <div className="table-cell">
                                {`${participant.firstName} ${participant.lastName}`}
                            </div>
                            <div className="table-cell">{participant.location}</div>
                            <div className="table-cell">{participant.currentProgram}</div>
                            <div className="table-cell">{participant.lastEngagementDate}</div>
                            <div className="table-cell action">
                                <button
                                    className="view-button"
                                    onClick={() => handleViewParticipant(participant.id)}
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};