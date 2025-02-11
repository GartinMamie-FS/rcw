import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import './DemographicsReport.css';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

interface DemographicCounts {
    [key: string]: number;
}

export const DemographicsReport: React.FC = () => {
    const { organizationId } = useOrganization();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    const [raceCounts, setRaceCounts] = useState<DemographicCounts>({});
    const [genderCounts, setGenderCounts] = useState<DemographicCounts>({});
    const [orientationCounts, setOrientationCounts] = useState<DemographicCounts>({});
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const getLastTwelveMonths = () => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                label: date.toLocaleDateString('default', { month: 'long', year: 'numeric' })
            });
        }
        return months;
    };

    useEffect(() => {
        const fetchDemographics = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const [year, month] = selectedMonth.split('-');
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

            const raceCount: DemographicCounts = {};
            const genderCount: DemographicCounts = {};
            const orientationCount: DemographicCounts = {};
            const countedParticipants = new Set();

            const participantsQuery = query(
                collection(db, 'organizations', organizationId, 'participants')
            );
            const participantsSnapshot = await getDocs(participantsQuery);

            for (const participantDoc of participantsSnapshot.docs) {
                const lastEngagementRef = doc(
                    db,
                    'organizations',
                    organizationId,
                    'participants',
                    participantDoc.id,
                    'lastEngagement',
                    'current'
                );
                const lastEngagement = await getDoc(lastEngagementRef);
                const lastEngagementDate = lastEngagement.data()?.date;

                if (lastEngagementDate) {
                    const [month, day, year] = lastEngagementDate.split('/');
                    const engagementDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

                    if (engagementDate >= startOfMonth && engagementDate <= endOfMonth) {
                        const demographicsRef = doc(
                            db,
                            'organizations',
                            organizationId,
                            'participants',
                            participantDoc.id,
                            'demographics',
                            'current'
                        );
                        const demographics = await getDoc(demographicsRef);
                        const data = demographics.data();

                        if (data) {
                            countedParticipants.add(participantDoc.id);

                            if (data.race) {
                                raceCount[data.race] = (raceCount[data.race] || 0) + 1;
                            }
                            if (data.gender) {
                                genderCount[data.gender] = (genderCount[data.gender] || 0) + 1;
                            }
                            if (data.sexualOrientation) {
                                orientationCount[data.sexualOrientation] = (orientationCount[data.sexualOrientation] || 0) + 1;
                            }
                        }
                    }
                }
            }

            setRaceCounts(raceCount);
            setGenderCounts(genderCount);
            setOrientationCounts(orientationCount);
            setTotalParticipants(countedParticipants.size);
        };

        fetchDemographics();
    }, [organizationId, selectedMonth]);

    const generatePDF = () => {
        const doc = new jsPDF();
        const [year, month] = selectedMonth.split('-');
        const reportDate = new Date(parseInt(year), parseInt(month) - 1);
        const monthYear = reportDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        doc.setFontSize(18);
        doc.text(`Demographics Report - ${monthYear}`, 105, 20, { align: 'center' });

        let yPos = 40;

        doc.setFontSize(14);
        doc.text('Race/Ethnicity', 20, yPos);
        yPos += 10;
        Object.entries(raceCounts).forEach(([race, count]) => {
            doc.text(`${race}: ${count}`, 20, yPos);
            yPos += 10;
        });

        yPos += 10;
        doc.text('Gender', 20, yPos);
        yPos += 10;
        Object.entries(genderCounts).forEach(([gender, count]) => {
            doc.text(`${gender}: ${count}`, 20, yPos);
            yPos += 10;
        });

        yPos += 10;
        doc.text('Sexual Orientation', 20, yPos);
        yPos += 10;
        Object.entries(orientationCounts).forEach(([orientation, count]) => {
            doc.text(`${orientation}: ${count}`, 20, yPos);
            yPos += 10;
        });

        return doc.output('arraybuffer');
    };

    const saveEndOfMonthReport = async () => {
        if (!organizationId) return;

        const confirmed = window.confirm(
            "Would you like to save this month's demographics report?"
        );

        if (!confirmed) return;

        setIsSaving(true);
        try {
            const db = getFirestore();
            const storage = getStorage();

            const [year, month] = selectedMonth.split('-');
            const reportDate = new Date(parseInt(year), parseInt(month) - 1);
            const reportMonth = reportDate.toLocaleString('default', { month: 'long' });
            const reportYear = reportDate.getFullYear().toString();

            const pdfBytes = generatePDF();

            const storageRef = ref(storage, `organizations/${organizationId}/reports/demographics/${reportMonth}${reportYear}.pdf`);
            await uploadBytes(storageRef, pdfBytes);

            await setDoc(
                doc(db, 'organizations', organizationId, 'monthlyReports', `${reportMonth}-${reportYear}`),
                {
                    demographicsReport: true,
                    lastUpdated: serverTimestamp()
                },
                { merge: true }
            );

            return true;
        } catch (error) {
            console.error('Error saving report:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="demographics-report">
            <div className="month-selector-container">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="month-selector"
                >
                    {getLastTwelveMonths().map(month => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="report-actions">
                <button
                    className="save-report-button"
                    onClick={saveEndOfMonthReport}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Report'}
                </button>
                <button
                    onClick={() => {
                        const doc = new jsPDF();
                        const [year, month] = selectedMonth.split('-');
                        const reportDate = new Date(parseInt(year), parseInt(month) - 1);
                        const monthYear = reportDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                        doc.setFontSize(18);
                        doc.text(`Demographics Report - ${monthYear}`, 105, 20, { align: 'center' });

                        let yPos = 40;

                        doc.setFontSize(14);
                        doc.text('Race/Ethnicity', 20, yPos);
                        yPos += 10;
                        Object.entries(raceCounts).forEach(([race, count]) => {
                            doc.text(`${race}: ${count}`, 20, yPos);
                            yPos += 10;
                        });

                        yPos += 10;
                        doc.text('Gender', 20, yPos);
                        yPos += 10;
                        Object.entries(genderCounts).forEach(([gender, count]) => {
                            doc.text(`${gender}: ${count}`, 20, yPos);
                            yPos += 10;
                        });

                        yPos += 10;
                        doc.text('Sexual Orientation', 20, yPos);
                        yPos += 10;
                        Object.entries(orientationCounts).forEach(([orientation, count]) => {
                            doc.text(`${orientation}: ${count}`, 20, yPos);
                            yPos += 10;
                        });

                        doc.save(`Demographics_Report_${monthYear}.pdf`);
                    }}
                    className="generate-pdf-button"
                >
                    Generate PDF Report
                </button>
            </div>

            <div className="report-grid">
                <div className="report-card">
                    <h3>Race/Ethnicity</h3>
                    <div className="report-list">
                        {Object.entries(raceCounts).map(([race, count]) => (
                            <div key={race} className="report-item">
                                <span>{race}</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="report-card">
                    <h3>Gender</h3>
                    <div className="report-list">
                        {Object.entries(genderCounts).map(([gender, count]) => (
                            <div key={gender} className="report-item">
                                <span>{gender}</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="report-card">
                    <h3>Sexual Orientation</h3>
                    <div className="report-list">
                        {Object.entries(orientationCounts).map(([orientation, count]) => (
                            <div key={orientation} className="report-item">
                                <span>{orientation}</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="total-card">
                <h3>Total Participants</h3>
                <span>{totalParticipants}</span>
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>Race/Ethnicity Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={Object.entries(raceCounts).map(([name, value]) => ({ name, value }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {Object.keys(raceCounts).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Gender Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={Object.entries(genderCounts).map(([name, value]) => ({ name, value }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#82ca9d"
                                label
                            >
                                {Object.keys(genderCounts).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 120}, 70%, 50%)`} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Sexual Orientation Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={Object.entries(orientationCounts).map(([name, value]) => ({ name, value }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#ffc658"
                                label
                            >
                                {Object.keys(orientationCounts).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 240}, 70%, 50%)`} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
