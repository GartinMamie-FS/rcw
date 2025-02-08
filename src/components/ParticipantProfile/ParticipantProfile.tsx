import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './ParticipantProfile.css';
import { EditPeerProfile } from './EditPeerProfile';
import { DocumentsSection } from './DocumentSection';
import { AddDocument } from './AddDocument';
import { PeerProgramSection } from './PeerProgramSection';
import { ManageProgram } from './ManageProgram';
import { PeerLocationSection } from './PeerLocationSection';
import { UpdatePeerLocation } from './UpdatePeerLocation';
import { PeerServicesSection } from './PeerServicesSection';
import { UpdatePeerServices } from './UpdatePeerServices';
import { ProfileSection } from './ProfileSection';
import { NotesSection } from './NotesSection';
import { AddNotes } from './AddNotes';
import { ViewNote } from './ViewNote';

interface ParticipantInfo {
    primaryLocation: string;
    programIds: string[];
    lastActivityDate: string;
}

interface Program {
    programName: string;
}

interface Note {
    id: string;
    completionDate: string;
    location: string;
    staffName: string;
    staffNote: string;
}

interface ParticipantProfileProps {
    organizationId: string;
    participantId: string;
    onBackToParticipants?: () => void;
}

export const ParticipantProfile: React.FC<ParticipantProfileProps> = ({ participantId }) => {
    const { organizationId } = useOrganization();
    const [currentSection, setCurrentSection] = useState('Profile');
    const [isManageServicesExpanded, setIsManageServicesExpanded] = useState(false);
    const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({
        primaryLocation: '',
        programIds: [],
        lastActivityDate: ''
    });
    const [participantName, setParticipantName] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useEffect(() => {
        const fetchParticipantData = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const participantDoc = await getDoc(doc(db, 'organizations', organizationId, 'participants', participantId));

            if (participantDoc.exists()) {
                const firstName = participantDoc.data().firstName || '';
                const lastName = participantDoc.data().lastName || '';
                setParticipantName(`${firstName} ${lastName}`);

                const locationQuery = query(
                    collection(db, 'organizations', organizationId, 'participants', participantId, 'participantLocation'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const locationSnapshot = await getDocs(locationQuery);
                const location = locationSnapshot.empty ? '' : locationSnapshot.docs[0].data().location || '';

                const programQuery = query(
                    collection(db, 'organizations', organizationId, 'participants', participantId, 'participantProgram'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const programSnapshot = await getDocs(programQuery);
                const programs = programSnapshot.empty ? [] :
                    (programSnapshot.docs[0].data().programs || [])
                        .map((program: Program) => program.programName)
                        .filter(Boolean);

                const lastEngagementDoc = await getDoc(
                    doc(db, 'organizations', organizationId, 'participants', participantId, 'lastEngagement', 'current')
                );
                const lastActivityDate = lastEngagementDoc.data()?.date || '';

                setParticipantInfo({
                    primaryLocation: location,
                    programIds: programs,
                    lastActivityDate: lastActivityDate
                });
            }
        };

        fetchParticipantData();
    }, [participantId, refreshTrigger, organizationId]);

    const renderContent = () => {
        switch (currentSection) {
            case 'Profile':
                return <ProfileSection
                    participantId={participantId}
                    onEditClick={() => setCurrentSection('EditProfile')}
                    key={refreshTrigger}
                />;
            case 'EditProfile':
                return <EditPeerProfile
                    participantId={participantId}
                    onSaveComplete={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setCurrentSection('Profile');
                    }}
                />;
            case 'Notes':
                return <NotesSection
                    participantId={participantId}
                    onAddClick={() => setCurrentSection('AddNotes')}
                    onViewNote={(note: Note) => {
                        setSelectedNote(note);
                        setCurrentSection('ViewNote');
                    }}
                    refreshTrigger={refreshTrigger}
                />;
            case 'AddNotes':
                return <AddNotes
                    participantId={participantId}
                    onSaveComplete={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setCurrentSection('Notes');
                    }}
                />;
            case 'ViewNote':
                return selectedNote && (
                    <ViewNote
                        note={{
                            completionDate: selectedNote.completionDate,
                            location: selectedNote.location,
                            staffName: selectedNote.staffName,
                            staffNote: selectedNote.staffNote,
                            organizationId: organizationId || ''
                        }}
                        onClose={() => setCurrentSection('Notes')}
                    />
                );
            case 'Documents':
                return <DocumentsSection
                    participantId={participantId}
                    onAddClick={() => setCurrentSection('AddDocument')}
                />;
            case 'AddDocument':
                return <AddDocument
                    participantId={participantId}
                    onSaveComplete={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setCurrentSection('Documents');
                    }}
                />;
            case 'PeerProgram':
                return <PeerProgramSection
                    participantId={participantId}
                    onManageClick={() => setCurrentSection('ManageProgram')}
                />;
            case 'ManageProgram':
                return <ManageProgram
                    participantId={participantId}
                    onSaveComplete={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setCurrentSection('PeerProgram');
                    }}
                />;
            case 'Location':
                return <PeerLocationSection
                    participantId={participantId}
                    onEditClick={() => setCurrentSection('EditLocation')}
                />;
            case 'EditLocation':
                return <UpdatePeerLocation
                    participantId={participantId}
                    onSaveComplete={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setCurrentSection('Location');
                    }}
                />;
            case 'Services':
                return <PeerServicesSection
                    participantId={participantId}
                    onEditClick={() => setCurrentSection('EditServices')}
                />;
            case 'EditServices':
                return <UpdatePeerServices
                    participantId={participantId}
                    onComplete={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setCurrentSection('Services');
                    }}
                />;
        }
    };

    return (
        <div className="participant-profile-container">
            <div className="nav-column">
                <nav className="nav-links">
                    <button
                        onClick={() => setCurrentSection('Profile')}
                        disabled={!organizationId}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setCurrentSection('Notes')}
                        disabled={!organizationId}
                    >
                        Notes
                    </button>
                    <button
                        onClick={() => setCurrentSection('Documents')}
                        disabled={!organizationId}
                    >
                        Documents
                    </button>

                    <div className="manage-services">
                        <button
                            onClick={() => setIsManageServicesExpanded(!isManageServicesExpanded)}
                            className="manage-services-button"
                            disabled={!organizationId}
                        >
                            Manage Services {isManageServicesExpanded ? '▼' : '▶'}
                        </button>

                        {isManageServicesExpanded && (
                            <div className="services-submenu">
                                <button
                                    onClick={() => setCurrentSection('PeerProgram')}
                                    disabled={!organizationId}
                                >
                                    Peer Program
                                </button>
                                <button
                                    onClick={() => setCurrentSection('Services')}
                                    disabled={!organizationId}
                                >
                                    Peer Services
                                </button>
                                <button
                                    onClick={() => setCurrentSection('Location')}
                                    disabled={!organizationId}
                                >
                                    Location Services
                                </button>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            <div className="content-column">
                <div className="info-card">
                    <div className="participant-header">
                        <h2>{participantName}</h2>
                        <div className="participant-details">
                            <p>Primary Location: {participantInfo.primaryLocation}</p>
                            <p>Program ID(s): {participantInfo.programIds.join(', ')}</p>
                            <p>Last Activity Date: {participantInfo.lastActivityDate}</p>
                        </div>
                    </div>
                </div>

                <div className="content-card">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
