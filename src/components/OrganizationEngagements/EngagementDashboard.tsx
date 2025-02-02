import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import './EngagementDashboard.css';

interface EngagementStats {
    totalParticipants: number;
    activeParticipants: number;
    recentEngagements: number;
    completedEngagements: number;
}

export const EngagementDashboard = () => {
    const { organizationId } = useOrganization();
    const [stats, setStats] = useState<EngagementStats>({
        totalParticipants: 0,
        activeParticipants: 0,
        recentEngagements: 0,
        completedEngagements: 0
    });

    useEffect(() => {
        const fetchEngagementStats = async () => {
            if (!organizationId) return;

            const db = getFirestore();

            // Fetch participants
            const participantsQuery = query(
                collection(db, 'participants'),
                where('organizationId', '==', organizationId)
            );
            const participantsSnapshot = await getDocs(participantsQuery);

            // Fetch engagements
            const engagementsQuery = query(
                collection(db, 'engagements'),
                where('organizationId', '==', organizationId)
            );
            const engagementsSnapshot = await getDocs(engagementsQuery);

            setStats({
                totalParticipants: participantsSnapshot.size,
                activeParticipants: participantsSnapshot.docs.filter(doc =>
                    doc.data().status === 'active'
                ).length,
                recentEngagements: engagementsSnapshot.docs.filter(doc => {
                    const data = doc.data();
                    const engagementDate = data.date?.toDate();
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return engagementDate >= thirtyDaysAgo;
                }).length,
                completedEngagements: engagementsSnapshot.docs.filter(doc =>
                    doc.data().status === 'completed'
                ).length
            });
        };

        fetchEngagementStats();
    }, [organizationId]);

    return (
        <div className="engagement-dashboard">
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Participants</h3>
                    <div className="stat-value">{stats.totalParticipants}</div>
                </div>
                <div className="stat-card">
                    <h3>Active Participants</h3>
                    <div className="stat-value">{stats.activeParticipants}</div>
                </div>
                <div className="stat-card">
                    <h3>Recent Engagements</h3>
                    <div className="stat-value">{stats.recentEngagements}</div>
                    <div className="stat-subtitle">Last 30 days</div>
                </div>
                <div className="stat-card">
                    <h3>Completed Engagements</h3>
                    <div className="stat-value">{stats.completedEngagements}</div>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent Activity</h3>
                {/* Recent activity list will go here */}
            </div>
        </div>
    );
};
