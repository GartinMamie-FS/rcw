import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { EngagementDashboard } from './EngagementDashboard';
import { EngagementList } from './EngagementList';
import { EngagementMetrics } from './EngagementMetrics';
import { AddStaffScreen } from '../Enterprise';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';
import './OrganizationEngagements.css';

export const OrganizationEngagements = () => {
    const { organizationId } = useOrganization();
    const [currentView, setCurrentView] = useState('dashboard');
    const [userRole, setUserRole] = useState<'developer' | 'admin' | 'staff'>('staff');
    const db = getFirestore();

    useEffect(() => {
        const fetchUserRole = async () => {
            if (auth.currentUser && organizationId) {
                const userDoc = doc(db, 'organizations', organizationId, 'users', auth.currentUser.uid);
                const userSnapshot = await getDoc(userDoc);
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    console.log('User Role:', userData.role);
                    setUserRole(userData.role);
                }
            }
        };
        fetchUserRole();
    }, [organizationId]);

    const renderContent = () => {
        if (userRole === 'admin') {
            return <AddStaffScreen organizationId={organizationId} />;
        }


        switch (currentView) {
            case 'dashboard':
                return <EngagementDashboard />;
            case 'list':
                return <EngagementList />;
            case 'metrics':
                return <EngagementMetrics />;
            default:
                return <EngagementDashboard />;
        }
    };

    return (
        <div className="organization-engagements">
            <div className="engagements-header">
                <h2>{userRole === 'admin' ? 'Staff Management' : 'Organization Engagements'}</h2>
                <nav className="view-selector">
                    {userRole === 'admin' ? (
                        <button
                            onClick={() => setCurrentView('staff')}
                            className="active"
                            disabled={!organizationId}
                        >
                            Manage Staff
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={currentView === 'dashboard' ? 'active' : ''}
                                disabled={!organizationId}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setCurrentView('list')}
                                className={currentView === 'list' ? 'active' : ''}
                                disabled={!organizationId}
                            >
                                Engagement List
                            </button>
                            <button
                                onClick={() => setCurrentView('metrics')}
                                className={currentView === 'metrics' ? 'active' : ''}
                                disabled={!organizationId}
                            >
                                Metrics
                            </button>
                        </>
                    )}
                </nav>
            </div>

            <div className="engagements-content">
                {renderContent()}
            </div>
        </div>
    );
};
