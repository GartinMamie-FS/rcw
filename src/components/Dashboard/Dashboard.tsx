import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import './Dashboard.css';
import { Account } from './Account';
import { Participants } from './Participants/Participants';
import { IntakeSession } from './Intake/IntakeSession';
import { ParticipantProfile } from "./ParticipantProfile/ParticipantProfile";
import { GroupEngagementsScreen } from './GroupEngagements/GroupEngagementsScreen';
import { ManageLocationsScreen } from './ManageLocation/ManageLocationScreen';
import { ManageProgramsScreen } from './ManagePrograms/ManageProgramsScreen';
import { ManageServicesScreen } from './ManageServices/ManageServicesScreen';
import { ReportsScreen } from "./Reports/ReportsScreen";
import { EnterpriseScreen } from './Enterprise/EnterpriseScreen';
import { OrganizationEngagementsScreen } from './OrganizationEngagements/OrganizationEngagementsScreen';
import { OrganizationManagementScreen } from '../Enterprise/OrganizationManagementScreen.tsx';
import { AddStaffScreen } from '../Enterprise/AddStaffScreen.tsx';
import { useOrganization } from '../../context/OrganizationContext';

interface DashboardProps {
    userEmail: string;
    userName: string;
    userRole: 'developer' | 'admin' | 'staff';
    onLogout: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, userRole, onLogout }) => {
    const { organizationId, setOrganizationId } = useOrganization();
    const [userName, setUserName] = useState('');
    const [currentScreen, setCurrentScreen] = useState('Participants');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isOrgMenuExpanded, setIsOrgMenuExpanded] = useState(false);
    const [isEnterpriseMenuExpanded, setIsEnterpriseMenuExpanded] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showIntakeSession, setShowIntakeSession] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

    const enterpriseItems = [
        'Organization',
        'Add Staff'
    ];

    const organizationItems = [
        'Manage Program ID',
        'Manage Services',
        'Manage Locations'
    ];

    useEffect(() => {
        const fetchUserName = async () => {
            const db = getFirestore();
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                setUserName(`${userData.firstName} ${userData.lastName}`);
            }
        };

        fetchUserName();
    }, [userEmail]);

    useEffect(() => {
        const fetchUserOrganization = async () => {
            if (userRole !== 'developer') {
                const db = getFirestore();
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', userEmail));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    setOrganizationId(userData.organizationId || '');
                }
            }
        };

        fetchUserOrganization();
    }, [userEmail, userRole, setOrganizationId]);

    const renderContent = () => {
        if (showIntakeSession) {
            return (
                <IntakeSession
                    onClose={() => setShowIntakeSession(false)}
                    onComplete={() => {
                        setShowIntakeSession(false);
                    }}
                    onNavigateToPeerProfile={(id) => {
                        setSelectedParticipantId(id);
                        setShowIntakeSession(false);
                    }}
                />
            );
        }

        switch (currentScreen) {
            case 'Organization':
                return userRole === 'developer' ? <OrganizationManagementScreen /> : null;
            case 'Add Staff':
                return userRole === 'developer' ? <AddStaffScreen /> : null;
            case 'Participants':
                return selectedParticipantId ? (
                    <ParticipantProfile
                        participantId={selectedParticipantId}
                        onBackToParticipants={() => setSelectedParticipantId(null)}
                    />
                ) : (
                    <Participants
                        onNewIntake={() => setShowIntakeSession(true)}
                        onViewParticipant={(id) => setSelectedParticipantId(id)}
                        organizationId={organizationId} // Add this prop
                    />
                );
            case 'GroupEngagements':
                return <GroupEngagementsScreen onNavigateToParticipants={() => setCurrentScreen('Participants')} />;
            case 'OrganizationEngagements':
                return <OrganizationEngagementsScreen />;
            case 'Reports':
                return <ReportsScreen />;
            case 'Manage Locations':
                return <ManageLocationsScreen />;
            case 'Manage Program ID':
                return <ManageProgramsScreen />;
            case 'Manage Services':
                return <ManageServicesScreen />;
            default:
                return <Participants onNewIntake={() => setShowIntakeSession(true)} onViewParticipant={(id) => setSelectedParticipantId(id)} />;
        }
    };

    return (
        <div className="dashboard">
            <header className="top-bar">
                <h1>Recovery Connect</h1>
                <div className="profile-section">
                    <div
                        className="profile-trigger"
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    >
                        <div className="profile-image"></div>
                        <span>{userName}</span>
                    </div>
                    {isProfileMenuOpen && (
                        <div className="profile-menu">
                            <button onClick={() => setShowAccount(true)}>Account</button>
                            <button onClick={onLogout}>Log Out</button>
                        </div>
                    )}
                    {showAccount && (
                        <div className="modal-overlay">
                            <Account
                                userEmail={userEmail}
                                userId={auth.currentUser?.uid || ''}
                                onClose={() => setShowAccount(false)}
                            />
                        </div>
                    )}
                </div>
            </header>

            <div className="main-content">
                <nav className="side-nav">
                    {userRole === 'developer' && (
                        <div className="nav-section">
                            <div
                                className="nav-header"
                                onClick={() => setIsEnterpriseMenuExpanded(!isEnterpriseMenuExpanded)}
                            >
                                <span>Enterprise</span>
                                <span className={`arrow ${isEnterpriseMenuExpanded ? 'down' : 'right'}`}>▶</span>
                            </div>
                            {isEnterpriseMenuExpanded && (
                                <div className="nav-items">
                                    {enterpriseItems.map(item => (
                                        <button
                                            key={item}
                                            onClick={() => {
                                                setCurrentScreen(item);
                                                setShowIntakeSession(false);
                                            }}
                                            className="nav-item"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="nav-section">
                        <div
                            className="nav-header"
                            onClick={() => setIsOrgMenuExpanded(!isOrgMenuExpanded)}
                        >
                            <span>Organization</span>
                            <span className={`arrow ${isOrgMenuExpanded ? 'down' : 'right'}`}>▶</span>
                        </div>
                        {isOrgMenuExpanded && (
                            <div className="nav-items">
                                {organizationItems.map(item => (
                                    <button
                                        key={item}
                                        onClick={() => {
                                            setCurrentScreen(item);
                                            setShowIntakeSession(false);
                                        }}
                                        className="nav-item"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        className="nav-link"
                        onClick={() => {
                            setCurrentScreen('Reports');
                            setShowIntakeSession(false);
                        }}
                    >
                        Reports
                    </button>
                    <button
                        className="nav-link"
                        onClick={() => {
                            setCurrentScreen('GroupEngagements');
                            setShowIntakeSession(false);
                        }}
                    >
                        Group Engagements
                    </button>
                    <button
                        className="nav-link"
                        onClick={() => {
                            setCurrentScreen('Participants');
                            setShowIntakeSession(false);
                            setSelectedParticipantId(null);
                        }}
                    >
                        Participants
                    </button>
                    <button
                        className="nav-link"
                        onClick={() => {
                            setCurrentScreen('OrganizationEngagements');
                            setShowIntakeSession(false);
                        }}
                    >
                        Organization Engagements
                    </button>
                </nav>

                <main className="content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
