import React, { useState } from 'react';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import { ParticipantInformationForm } from './ParticipantInformationForm.tsx';
import { SessionInformationForm } from './SessionInformationForm';
import { ParticipantAssignmentsForm } from './ParticipantAssignmentsForm';
import './IntakeSession.css';

interface IntakeSessionProps {
    organizationId: string;
    onClose: () => void;
    onComplete: () => void;
    onNavigateToPeerProfile: (id: string) => void;
}

export const IntakeSession: React.FC<IntakeSessionProps> = ({ onClose, onComplete, onNavigateToPeerProfile }) => {
    const { organizationId } = useOrganization();
    const [currentPage, setCurrentPage] = useState('Participant Information');
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [participantId, setParticipantId] = useState('');

    const navigationItems = [
        'Participant Information',
        'Session Information',
        'Participant Assignments'
    ];

    const allSectionsCompleted = navigationItems.every(section =>
        completedSections.has(section)
    );

    const updateParticipantStatus = async (participantId: string) => {
        const db = getFirestore();
        const participantRef = doc(db, 'participants', participantId);

        await updateDoc(participantRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            organizationId
        });
    };

    return (
        <div className="intake-session-component">
            <div className="header">
                <h2>Intake Session</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="intake-content">
                <div className="navigation-panel">
                    <div className="nav-links">
                        {navigationItems.map((item) => (
                            <button
                                key={item}
                                className={`nav-link ${currentPage === item ? 'active' : ''}`}
                                onClick={() => setCurrentPage(item)}
                                disabled={!participantId && item !== 'Participant Information'}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <button
                        className={`submit-button ${(!participantId || !allSectionsCompleted) ? 'disabled' : ''}`}
                        disabled={!participantId || !allSectionsCompleted}
                        onClick={() => {
                            if (participantId && organizationId) {
                                updateParticipantStatus(participantId);
                                onComplete();
                                onNavigateToPeerProfile(participantId);
                            }
                        }}
                    >
                        Ready to Submit
                    </button>
                </div>

                <div className="form-content">
                    {currentPage === 'Participant Information' && (
                        <ParticipantInformationForm
                            organizationId={organizationId}
                            onComplete={(id) => {
                                setParticipantId(id);
                                setCompletedSections(prev => new Set([...prev, 'Participant Information']));
                                setCurrentPage('Session Information');
                            }}
                        />
                    )}
                    {currentPage === 'Session Information' && (
                        <SessionInformationForm
                            participantId={participantId}
                            organizationId={organizationId}
                            onComplete={() => {
                                setCompletedSections(prev => new Set([...prev, 'Session Information']));
                                setCurrentPage('Participant Assignments');
                            }}
                        />
                    )}
                    {currentPage === 'Participant Assignments' && (
                        <ParticipantAssignmentsForm
                            participantId={participantId}
                            organizationId={organizationId}
                            onComplete={() => {
                                setCompletedSections(prev => new Set([...prev, 'Participant Assignments']));
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
