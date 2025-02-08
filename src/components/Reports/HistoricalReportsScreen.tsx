import React, { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { useOrganization } from '../../context/OrganizationContext';
import './HistoricalReportsScreen.css';

enum ReportType {
    ORGANIZATION = 'ORGANIZATION',
    PROGRAM = 'PROGRAM',
    RECAPS = 'recaps'
}

interface StorageReport {
    name: string;
    path: string;
    timestamp: Date;
}

interface ReportTypeButtonProps {
    text: string;
    selected: boolean;
    onClick: () => void;
}

const ReportTypeButton: React.FC<ReportTypeButtonProps> = ({ text, selected, onClick }) => (
    <button className={`report-type-button ${selected ? 'selected' : ''}`} onClick={onClick}>
        {text}
    </button>
);

export const HistoricalReportsScreen: React.FC = () => {
    const {organizationId} = useOrganization();
    const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
    const [availableReports, setAvailableReports] = useState<StorageReport[]>([]);

    useEffect(() => {
        const fetchReports = async () => {
            if (!organizationId || !selectedReportType) return;

            const storage = getStorage();
            const basePath = `organizations/${organizationId}/reports`;

            // Match the exact format being saved: 'January2025'
            let reportPath = '';
            switch (selectedReportType) {
                case ReportType.ORGANIZATION:
                    reportPath = `${basePath}/organization`;
                    break;
                case ReportType.PROGRAM:
                    reportPath = `${basePath}/programs`;
                    break;
                case ReportType.RECAPS:
                    reportPath = `${basePath}/recaps`;
                    break;
                default:
                    return;
            }

            try {
                const reportsRef = ref(storage, reportPath);
                const result = await listAll(reportsRef);
                const reportsData = await Promise.all(
                    result.items.map(async (item) => {
                        const metadata = await getMetadata(item);
                        return {
                            name: item.name,
                            path: item.fullPath,
                            timestamp: new Date(metadata.timeCreated)
                        };
                    })
                );
                setAvailableReports(reportsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchReports();
    }, [selectedReportType, organizationId]);



    const downloadReport = async (path: string) => {
        const storage = getStorage();
        const reportRef = ref(storage, path);
        const url = await getDownloadURL(reportRef);
        window.open(url, '_blank');
    };

    return (
        <div className="historical-reports">
            <div className="header-row">
                <h2>Historical Reports</h2>
                <button
                    className="back-button"
                    onClick={() => window.history.back()}
                >
                    Back to Current Reports
                </button>
            </div>

            <div className="report-type-buttons">
                <ReportTypeButton
                    text="Peer Services Reports"
                    selected={selectedReportType === ReportType.ORGANIZATION}
                    onClick={() => setSelectedReportType(ReportType.ORGANIZATION)}
                />
                <ReportTypeButton
                    text="Program Specific Reports"
                    selected={selectedReportType === ReportType.PROGRAM}
                    onClick={() => setSelectedReportType(ReportType.PROGRAM)}
                />
                <ReportTypeButton
                    text="Public Awareness/Impact Reports"
                    selected={selectedReportType === ReportType.RECAPS}
                    onClick={() => setSelectedReportType(ReportType.RECAPS)}
                />
            </div>

            <hr/>

            <div className="reports-list">
                {availableReports.map((report) => (
                    <div key={report.path} className="report-item">
                        <span>{report.name}</span>
                        <div className="report-actions">
                            <button
                                onClick={() => downloadReport(report.path)}
                                className="download-button"
                                disabled={!organizationId}
                            >
                                Download
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};