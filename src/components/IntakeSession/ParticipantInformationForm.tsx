import React, { useState } from 'react';
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import { format } from 'date-fns';

interface ParticipantInformationFormProps {
    onComplete: (id: string) => void;
    organizationId: string;
}

export const ParticipantInformationForm: React.FC<ParticipantInformationFormProps> = ({ onComplete }) => {
    const { organizationId } = useOrganization();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    const saveParticipantInfo = async () => {
        const db = getFirestore();
        const batch = writeBatch(db);

        const participantRef = doc(collection(db, 'organizations', organizationId, 'participants'));
        const participantId = participantRef.id;

        const participantData = {
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? format(new Date(dateOfBirth), 'MM/dd/yyyy') : '',
            createdAt: serverTimestamp()
        };
        batch.set(participantRef, participantData);

        batch.set(doc(participantRef, 'participantInformation', 'details'), {
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? format(new Date(dateOfBirth), 'MM/dd/yyyy') : '',
            createdAt: serverTimestamp()
        });

        batch.set(doc(participantRef, 'participantLocation', 'current'), {
            createdAt: serverTimestamp()
        });

        batch.set(doc(participantRef, 'participantProgram', 'current'), {
            createdAt: serverTimestamp()
        });

        batch.set(doc(participantRef, 'participantServices', 'current'), {
            createdAt: serverTimestamp()
        });

        await batch.commit();
        return participantId;
    };

    return (
        <div className="participant-form">
            <h2>Participant Information</h2>
            <p className="required-text">* indicates required field</p>

            <div className="form-group">
                <label>First Name *</label>
                <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                    required
                />
            </div>

            <div className="form-group">
                <label>Last Name *</label>
                <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                    required
                />
            </div>

            <div className="form-group">
                <label>Date of Birth</label>
                <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="form-input"
                />
            </div>

            <button
                className="save-button"
                disabled={!firstName || !lastName || !organizationId}
                onClick={async () => {
                    const id = await saveParticipantInfo();
                    onComplete(id);
                }}
            >
                Save
            </button>
        </div>
    );
};
