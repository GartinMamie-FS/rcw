import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { useOrganization } from '../../context/OrganizationContext';
import { jsPDF } from 'jspdf';
import './OrganizationRecapsReport.css';

interface RecapSummary {
    type: string;
    count: number;
    totalAmount: number;
}

export const OrganizationRecapsReport: React.FC = () => {
    const {organizationId} = useOrganization();
    const [recapSummaries, setRecapSummaries] = useState<RecapSummary[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isSaving, setIsSaving] = useState(false);


    const months = Array.from({length: 12}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
            value: date.toISOString().slice(0, 7),
            label: date.toLocaleDateString('default', {month: 'long', year: 'numeric'})
        };
    });

    useEffect(() => {
        const fetchRecaps = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const recapsRef = collection(db, 'organizations', organizationId, 'recaps');
            const recapsSnapshot = await getDocs(recapsRef);

            const [selectedYear, selectedMonthNum] = selectedMonth.split('-');

            const summaries = recapsSnapshot.docs.reduce((acc: { [key: string]: RecapSummary }, doc) => {
                const data = doc.data();
                const recapDate = new Date(data.date);

                if (recapDate.getFullYear() !== parseInt(selectedYear) ||
                    recapDate.getMonth() !== parseInt(selectedMonthNum) - 1) {
                    return acc;
                }

                const type = data.recapTypeName;

                if (!acc[type]) {
                    acc[type] = {
                        type,
                        count: 0,
                        totalAmount: 0
                    };
                }

                acc[type].count += 1;

                Object.values(data.fields).forEach(value => {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                        acc[type].totalAmount += numValue;
                    }
                });

                return acc;
            }, {});

            setRecapSummaries(Object.values(summaries));
        };

        fetchRecaps();
    }, [organizationId, selectedMonth]);

    const generatePDF = () => {
        const doc = new jsPDF();
        const currentMonth = new Date(selectedMonth).toLocaleString('default', {month: 'long'});
        const currentYear = new Date(selectedMonth).getFullYear().toString();

        doc.setFontSize(18);
        doc.text('Organization Recaps Report', 105, 20, {align: 'center'});

        let yPos = 40;
        recapSummaries.forEach(summary => {
            doc.setFontSize(14);
            doc.text(summary.type, 20, yPos);
            yPos += 10;
            doc.setFontSize(12);
            doc.text(`Total Events: ${summary.count}`, 30, yPos);
            yPos += 10;
            if (summary.totalAmount > 0) {
                doc.text(`Total Amount: ${summary.totalAmount}`, 30, yPos);
                yPos += 10;
            }
            yPos += 10;
        });

        doc.save(`RecapsReport_${currentMonth}_${currentYear}.pdf`);
        return doc.output('arraybuffer');
    };

    const saveEndOfMonthReport = async () => {
        if (!organizationId) return;

        const confirmed = window.confirm(
            "Would you like to save this month's recaps report?"
        );

        if (!confirmed) return;

        setIsSaving(true);
        try {
            const db = getFirestore();
            const storage = getStorage();
            const currentMonth = new Date(selectedMonth).toLocaleString('default', {month: 'long'});
            const currentYear = new Date(selectedMonth).getFullYear().toString();

            const pdfBytes = generatePDF();

            const storageRef = ref(storage, `organizations/${organizationId}/reports/recaps/${currentMonth}${currentYear}.pdf`);
            await uploadBytes(storageRef, pdfBytes);

            await setDoc(
                doc(db, 'organizations', organizationId, 'monthlyReports', `${currentMonth}-${currentYear}`),
                {
                    recapsReport: true,
                    lastUpdated: serverTimestamp()
                },
                {merge: true}
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
        <div className="organization-recaps-report">
            <div className="report-header">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="month-selector"
                >
                    {months.map(month => (
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
                    onClick={() => generatePDF()}
                    className="generate-pdf-button"
                >
                    Generate PDF Report
                </button>
            </div>

            <div className="recaps-container">
                {recapSummaries.length > 0 ? (
                    recapSummaries.map(summary => (
                        <div key={summary.type} className="recap-item">
                            <h3>{summary.type}</h3>
                            <p>Total Events: {summary.count}</p>
                            {summary.totalAmount > 0 && (
                                <p>Total Amount: {summary.totalAmount}</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="no-data">No recaps found for this month</p>
                )}
            </div>
        </div>
    );
};

