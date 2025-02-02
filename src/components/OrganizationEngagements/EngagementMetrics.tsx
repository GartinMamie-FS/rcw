import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import './EngagementMetrics.css';

interface MetricData {
    label: string;
    value: number;
    percentage: number;
}

export const EngagementMetrics = () => {
    const { organizationId } = useOrganization();
    const [metrics, setMetrics] = useState<MetricData[]>([]);
    const [timeFrame, setTimeFrame] = useState('month');

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const engagementsQuery = query(
                collection(db, 'engagements'),
                where('organizationId', '==', organizationId)
            );

            const snapshot = await getDocs(engagementsQuery);
            // Process metrics data here
            const calculatedMetrics = [
                {
                    label: 'Total Engagements',
                    value: snapshot.size,
                    percentage: 100
                },
                // Add more metrics as needed
            ];

            setMetrics(calculatedMetrics);
        };

        fetchMetrics();
    }, [organizationId, timeFrame]);

    return (
        <div className="engagement-metrics">
            <div className="metrics-header">
                <h3>Engagement Metrics</h3>
                <div className="time-selector">
                    <select
                        value={timeFrame}
                        onChange={(e) => setTimeFrame(e.target.value)}
                        disabled={!organizationId}
                    >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="quarter">Last Quarter</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
            </div>

            <div className="metrics-grid">
                {metrics.map((metric, index) => (
                    <div key={index} className="metric-card">
                        <h4>{metric.label}</h4>
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-percentage">
                            {metric.percentage}% {metric.percentage > 0 ? '↑' : '↓'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="metrics-chart">
                {/* Add visualization charts here */}
            </div>
        </div>
    );
};
