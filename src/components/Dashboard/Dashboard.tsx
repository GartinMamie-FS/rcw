import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import './Dashboard.css';
import { Account } from '../Account';
import { Participants } from '../Participant/Participants';
import { IntakeSession } from '../IntakeSession/IntakeSession';
import { ParticipantProfile } from "../ParticipantProfile/ParticipantProfile";
import { GroupEngagementsScreen } from '../GroupEngagements/GroupEngagements';
import { ManageLocationsScreen } from '../ManageLocation/ManageLocationScreen';
import { ManageProgramsScreen } from '../ManagePrograms/ManageProgramScreen';
import { ManageServicesScreen } from '../ManageServices/ManageServicesScreen';
import {ManageOrganizationRecapsScreen} from "../ManageOrganizationRecaps/ManageOrganizationRecaps";
import { ReportsScreen } from "../Reports/ReportsScreen";
import { OrganizationManagementScreen } from '../Enterprise/OrganizationManagementScreen';
import { useOrganization } from '../../context/OrganizationContext';
import { AdminOrganizationManagement } from '../Enterprise/AdminOrganizationManagement';
import { CreateOrganizationRecapScreen } from '../CreateOrganizationRecap/CreateOrganizationRecap';

interface DashboardProps {
    userEmail: string;
    userName: string;
    userRole: 'developer' | 'admin' | 'staff';
    onLogout: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, userRole, onLogout }) => {
    const {organizationId, setOrganizationId} = useOrganization();
    const [userName, setUserName] = useState('');
    const [currentScreen, setCurrentScreen] = useState('Participants');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isOrgMenuExpanded, setIsOrgMenuExpanded] = useState(false);
    const [isEnterpriseMenuExpanded, setIsEnterpriseMenuExpanded] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showIntakeSession, setShowIntakeSession] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [actualUserRole, setActualUserRole] = useState<'developer' | 'admin' | 'staff'>('staff');

    const enterpriseItems = [
        'Organization',
        'Add Staff'
    ];

    const organizationItems = [
        'Manage Organization Recaps',
        'Manage Program ID',
        'Manage Services',
        'Manage Locations',
    ];


    useEffect(() => {
        const fetchUserName = async () => {
            if (auth.currentUser) {
                const db = getFirestore();
                // Get all organizations
                const orgsRef = collection(db, 'organizations');
                const orgsSnapshot = await getDocs(orgsRef);

                // Find the organization where this user exists
                for (const orgDoc of orgsSnapshot.docs) {
                    const userRef = doc(db, 'organizations', orgDoc.id, 'users', auth.currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        console.log('Found user data:', userData); // This will help verify the data
                        setUserName(`${userData.firstName} ${userData.lastName}`);
                        break;
                    }
                }
            }
        };

        fetchUserName();
    }, [auth.currentUser?.uid]);

    useEffect(() => {
        const fetchUserOrganization = async () => {
            if (userRole !== 'developer' && auth.currentUser) {
                const db = getFirestore();
                const orgsRef = collection(db, 'organizations');
                const orgsSnapshot = await getDocs(orgsRef);

                for (const orgDoc of orgsSnapshot.docs) {
                    const userRef = doc(db, 'organizations', orgDoc.id, 'users', auth.currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        setOrganizationId(orgDoc.id);
                        break;
                    }
                }
            }
        };

        fetchUserOrganization();
    }, [userRole, setOrganizationId]);

    useEffect(() => {
        const fetchActualUserRole = async () => {
            if (organizationId && auth.currentUser) {
                const db = getFirestore();
                const userDoc = await getDoc(doc(db, 'organizations', organizationId, 'users', auth.currentUser.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setActualUserRole(userData.role);
                }
            }
        };

        fetchActualUserRole();
    }, [organizationId]);

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
                return actualUserRole === 'developer' ? <OrganizationManagementScreen/> :
                    <AdminOrganizationManagement/>;
            case 'OrganizationEngagements':
                return actualUserRole === 'admin' ? <AdminOrganizationManagement/> : <OrganizationManagementScreen/>;
            case 'CreateOrganizationRecap':
                return <CreateOrganizationRecapScreen onBack={() => setCurrentScreen('GroupEngagements')}/>;
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
                        organizationId={organizationId}
                    />
                );
            case 'GroupEngagements':
                return <GroupEngagementsScreen onNavigateToParticipants={() => setCurrentScreen('Participants')}/>;
            case 'Reports':
                return <ReportsScreen/>;
            case 'Manage Locations':
                return <ManageLocationsScreen/>;
            case 'Manage Program ID':
                return <ManageProgramsScreen/>;
            case 'Manage Services':
                return <ManageServicesScreen/>;
            case 'Manage Organization Recaps':
                return <ManageOrganizationRecapsScreen/>;
            default:
                return <Participants
                    onNewIntake={() => setShowIntakeSession(true)}
                    onViewParticipant={(id) => setSelectedParticipantId(id)}
                    organizationId={organizationId}
                />;
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
                    {(actualUserRole === 'admin' || actualUserRole === 'developer') && (
                        <button
                            className="nav-link"
                            onClick={() => {
                                setCurrentScreen('OrganizationEngagements');
                                setShowIntakeSession(false);
                            }}
                        >
                            Organization Engagements
                        </button>
                    )}

                    {actualUserRole === 'developer' && (
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

                    {(actualUserRole === 'admin' || actualUserRole === 'developer') && (
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
                    )}

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
                            setCurrentScreen('CreateOrganizationRecap');
                            setShowIntakeSession(false);
                        }}
                    >
                        Create Organization Recap
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
                </nav>

                <main className="content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};