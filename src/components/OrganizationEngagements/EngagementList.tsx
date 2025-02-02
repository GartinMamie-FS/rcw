import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import './EngagementList.css';

interface Engagement {
    id: string;
    participantName: string;
    type: string;
    date: string;
    location: string;
    status: string;
}

export const EngagementList = () => {
    const { organizationId } = useOrganization();
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEngagements = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const engagementsQuery = query(
                collection(db, 'engagements'),
                where('organizationId', '==', organizationId),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(engagementsQuery);
            const engagementData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Engagement[];

            setEngagements(engagementData);
            setLoading(false);
        };

        fetchEngagements();
    }, [organizationId]);

    return (
        <div className="engagement-list">
            <div className="list-header">
                <h3>Recent Engagements</h3>
                <div className="filters">
                    {/* Add filters here later */}
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading engagements...</div>
            ) : (
                <table className="engagements-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Participant</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {engagements.map(engagement => (
                        <tr key={engagement.id}>
                            <td>{engagement.date}</td>
                            <td>{engagement.participantName}</td>
                            <td>{engagement.type}</td>
                            <td>{engagement.location}</td>
                            <td>
                                    <span className={`status-badge ${engagement.status}`}>
                                        {engagement.status}
                                    </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
