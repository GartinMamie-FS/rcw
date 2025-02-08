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
import {CreateOrganizationRecapScreen} from "../CreateOrganizationRecap/CreateOrganizationRecap.tsx";
import { Timestamp } from 'firebase/firestore';
import { SubscriptionContext } from '../../context/SubscriptionContext';

interface DashboardProps {
    userEmail: string;
    userName: string;
    userRole: 'developer' | 'admin' | 'staff';
    onLogout: () => Promise<void>;
}

interface OrganizationData {
    subscriptionEndDate: Timestamp;
    // ... other organization fields
}


export const Dashboard: React.FC<DashboardProps> = ({ userEmail, userRole, onLogout }) => {
    const {organizationId, setOrganizationId} = useOrganization();
    const [userName, setUserName] = useState('');
    const [currentScreen, setCurrentScreen] = useState('Participants');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isOrgMenuExpanded, setIsOrgMenuExpanded] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showIntakeSession, setShowIntakeSession] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [actualUserRole, setActualUserRole] = useState<'developer' | 'admin' | 'staff'>('staff');
    const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
    const [showRenewalBanner, setShowRenewalBanner] = useState(false);
    const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

    // Add the new useEffect here
    useEffect(() => {
        console.log('Current Screen:', currentScreen);
        console.log('User Role:', actualUserRole);
    }, [currentScreen, actualUserRole]);


    const organizationItems = [
        'Manage Public Awareness/Impact Reports',
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
            console.log('Incoming userRole prop:', userRole);
            console.log('Current auth user:', auth.currentUser?.email);

            if (auth.currentUser) {
                if (userRole === 'developer') {
                    console.log('Setting developer role');
                    setActualUserRole('developer');
                    return;
                }

                const db = getFirestore();
                const orgsRef = collection(db, 'organizations');
                const orgsSnapshot = await getDocs(orgsRef);

                for (const orgDoc of orgsSnapshot.docs) {
                    const userRef = doc(db, 'organizations', orgDoc.id, 'users', auth.currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        setOrganizationId(orgDoc.id);
                        const userData = userSnap.data();
                        setActualUserRole(userData.role);
                        console.log('Found user in organization:', userData.role);
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

    useEffect(() => {
        const fetchOrganizationData = async () => {
            if (organizationId) {
                const db = getFirestore();
                const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
                if (orgDoc.exists()) {
                    const data = orgDoc.data() as OrganizationData;
                    setOrganizationData(data);

                    const today = new Date();
                    const expirationDate = data.subscriptionEndDate.toDate();

                    // Check if subscription is expired
                    setIsSubscriptionExpired(today > expirationDate);

                    // Check if within one month of expiration
                    const oneMonthBeforeExpiration = new Date(expirationDate);
                    oneMonthBeforeExpiration.setMonth(oneMonthBeforeExpiration.getMonth() - 1);

                    if (today >= oneMonthBeforeExpiration) {
                        setShowRenewalBanner(true);
                    }
                }
            }
        };

        fetchOrganizationData();
    }, [organizationId]);


    const renderContent = () => {
        if (showIntakeSession) {
            return (
                <IntakeSession
                    organizationId={organizationId}
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
                console.log('Current Screen: Organization');
                console.log('Actual User Role:', actualUserRole);
                if (actualUserRole === 'developer') {
                    console.log('Rendering OrganizationManagementScreen');
                    return <OrganizationManagementScreen />;
                } else {
                    console.log('Rendering AdminOrganizationManagement');
                    return <AdminOrganizationManagement organizationId={organizationId}/>;
                }
            case 'OrganizationEngagements':
                return actualUserRole === 'admin' ?
                    <AdminOrganizationManagement organizationId={organizationId}/> :
                    <OrganizationManagementScreen />;
            case 'CreateOrganizationRecap':
                return <CreateOrganizationRecapScreen
                   organizationId={organizationId}
                   onBack={() => setCurrentScreen('GroupEngagements')}
                />;
            case 'Participants':
                return selectedParticipantId ? (
                    <ParticipantProfile
                        organizationId={organizationId}
                        participantId={selectedParticipantId}
                        onBackToParticipants={() => setSelectedParticipantId(null)}
                    />
                ) : (
                    <Participants
                        organizationId={organizationId}
                        onNewIntake={() => setShowIntakeSession(true)}
                        onViewParticipant={(id) => setSelectedParticipantId(id)}
                        isExpired={isSubscriptionExpired}
                    />
                );
            case 'GroupEngagements':
                return <GroupEngagementsScreen
                    organizationId={organizationId}
                    onNavigateToParticipants={() => setCurrentScreen('Participants')}
                />;
            case 'Reports':
                return <ReportsScreen organizationId={organizationId}/>;
            case 'Manage Locations':
                return <ManageLocationsScreen organizationId={organizationId}/>;
            case 'Manage Program ID':
                return <ManageProgramsScreen organizationId={organizationId}/>;
            case 'Manage Services':
                return <ManageServicesScreen organizationId={organizationId}/>;
            case 'Manage Public Awareness/Impact Reports':
                return <ManageOrganizationRecapsScreen organizationId={organizationId}/>;
            default:
                return <Participants
                    organizationId={organizationId}
                    onNewIntake={() => setShowIntakeSession(true)}
                    onViewParticipant={(id) => setSelectedParticipantId(id)}
                    isExpired={isSubscriptionExpired}
                />;
        }
    };

    return (
        <SubscriptionContext.Provider value={{ isExpired: isSubscriptionExpired }}>
            <div className="dashboard">
                <header className="dashboard-top-bar">
                    <h1>Recovery Connect</h1>
                    <div className="dashboard-profile-section">
                        <div
                            className="dashboard-profile-trigger"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                            <div className="dashboard-profile-image"></div>
                            <span>{userName}</span>
                        </div>
                        {isProfileMenuOpen && (
                            <div className="dashboard-profile-menu">
                                <button onClick={() => setShowAccount(true)}>Account</button>
                                <button onClick={onLogout}>Log Out</button>
                            </div>
                        )}
                        {showAccount && (
                            <div className="dashboard-modal-overlay">
                                <Account
                                    userEmail={userEmail}
                                    userId={auth.currentUser?.uid || ''}
                                    onClose={() => setShowAccount(false)}
                                />
                            </div>
                        )}
                    </div>
                </header>

                {(showRenewalBanner || isSubscriptionExpired) && (
                    <div className={`renewal-banner ${isSubscriptionExpired ? 'expired-warning' : ''}`}>
                    <span>
                        {isSubscriptionExpired
                            ? "⚠️ Your subscription has expired. You can view all data but cannot make changes until renewal."
                            : `⚠️ Your subscription expires on ${organizationData?.subscriptionEndDate.toDate().toLocaleDateString()}`
                        }
                    </span>
                        <button
                            onClick={() => {
                                window.location.href = "mailto:mamie.gartin@icloud.com?subject=Subscription Renewal";
                            }}
                            className="renewal-button"
                        >
                            Contact Support to Renew
                        </button>
                    </div>
                )}

                <div className="dashboard-main-content">
                    <nav className="dashboard-side-nav">
                        {(actualUserRole === 'admin' || actualUserRole === 'developer') && (
                            <button
                                className="dashboard-nav-link"
                                onClick={() => {
                                    setCurrentScreen('OrganizationEngagements');
                                    setShowIntakeSession(false);
                                }}
                            >
                                Organization Engagements
                            </button>
                        )}

                        {(actualUserRole === 'admin' || actualUserRole === 'developer') && (
                            <div className="dashboard-nav-section">
                                <div
                                    className="dashboard-nav-header"
                                    onClick={() => setIsOrgMenuExpanded(!isOrgMenuExpanded)}
                                >
                                    <span>Organization</span>
                                    <span className={`dashboard-arrow ${isOrgMenuExpanded ? 'down' : 'right'}`}>▶</span>
                                </div>
                                {isOrgMenuExpanded && (
                                    <div className="dashboard-nav-items">
                                        {organizationItems.map(item => (
                                            <button
                                                key={item}
                                                onClick={() => {
                                                    setCurrentScreen(item);
                                                    setShowIntakeSession(false);
                                                }}
                                                className="dashboard-nav-item"
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="dashboard-nav-link"
                            onClick={() => {
                                setCurrentScreen('Reports');
                                setShowIntakeSession(false);
                            }}
                        >
                            Reports
                        </button>
                        <button
                            className="dashboard-nav-link"
                            onClick={() => {
                                setCurrentScreen('GroupEngagements');
                                setShowIntakeSession(false);
                            }}
                        >
                            Group Engagements
                        </button>
                        <button
                            className="dashboard-nav-link"
                            onClick={() => {
                                setCurrentScreen('CreateOrganizationRecap');
                                setShowIntakeSession(false);
                            }}
                        >
                            Create Public Awareness/Impact Event
                        </button>
                        <button
                            className="dashboard-nav-link"
                            onClick={() => {
                                setCurrentScreen('Participants');
                                setShowIntakeSession(false);
                                setSelectedParticipantId(null);
                            }}
                        >
                            Participants
                        </button>
                    </nav>

                    <main className="dashboard-content-area">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </SubscriptionContext.Provider>
    );
};