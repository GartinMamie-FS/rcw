import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import './GroupEngagements.css';

interface ParticipantWithSelection {
    id: string;
    firstName: string;
    lastName: string;
    isSelected: boolean;
}

interface ParticipantSelectionProps {
    serviceName: string;
    participants: ParticipantWithSelection[];
    onParticipantsSelected: (participants: ParticipantWithSelection[]) => void;
}

export const ParticipantSelectionContent: React.FC<ParticipantSelectionProps> = ({
                                                                                     serviceName,
                                                                                     participants,
                                                                                     onParticipantsSelected
                                                                                 }) => {
    const { organizationId } = useOrganization();
    const [localParticipants, setLocalParticipants] = useState<ParticipantWithSelection[]>(participants);

    useEffect(() => {
        const loadParticipants = async () => {
            if (localParticipants.length === 0 && organizationId) {
                const db = getFirestore();
                const participantsQuery = query(
                    collection(db, 'participants'),
                    where('organizationId', '==', organizationId)
                );
                const snapshot = await getDocs(participantsQuery);
                const participantsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    firstName: doc.data().firstName,
                    lastName: doc.data().lastName,
                    isSelected: false
                }));
                setLocalParticipants(participantsList);
                onParticipantsSelected(participantsList);
            }
        };

        loadParticipants();
    }, [organizationId]);

    const handleCheckboxChange = (participantId: string, checked: boolean) => {
        const updatedParticipants = localParticipants.map(p =>
            p.id === participantId ? { ...p, isSelected: checked } : p
        );
        setLocalParticipants(updatedParticipants);
        onParticipantsSelected(updatedParticipants);
    };

    return (
        <div className="participant-selection">
            <h3>{serviceName}</h3>
            <div className="participants-list">
                {localParticipants.map(participant => (
                    <div key={participant.id} className="participant-item">
                        <input
                            type="checkbox"
                            checked={participant.isSelected}
                            onChange={(e) => handleCheckboxChange(participant.id, e.target.checked)}
                            id={participant.id}
                        />
                        <label htmlFor={participant.id}>
                            {participant.firstName} {participant.lastName}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

