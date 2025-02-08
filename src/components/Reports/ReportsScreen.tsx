import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query} from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { ReportType } from './types';
import './ReportsScreen.css';
import { OrganizationWideReport } from './OrganizationWideReport';
import { ProgramSpecificReport } from './ProgramSpecificReport';
import { OrganizationRecapsReport } from './OrganizationRecapsReport';

interface StorageReport {
    name: string;
    path: string;
    timestamp: number;
}

interface ReportTypeButtonProps {
    text: string;
    selected: boolean;
    onClick: () => void;
}

const ReportTypeButton: React.FC<ReportTypeButtonProps> = ({ text, selected, onClick }) => (
    <button
        className={`report-type-button ${selected ? 'selected' : ''}`}
        onClick={onClick}
    >
        {text}
    </button>
);


function renderReportContent(
    reportType: ReportType | null,
    selectedProgram: string | null
) {
    switch (reportType) {
        case ReportType.RECAPS:
            return <OrganizationRecapsReport />;
        case ReportType.ORGANIZATION:
            return <OrganizationWideReport />;
        case ReportType.PROGRAM:
            return selectedProgram ? (
                <ProgramSpecificReport programName={selectedProgram} />
            ) : null;
        default:
            return (
                <p className="select-prompt">
                    Select a report type to view data
                </p>
            );
    }
}


interface ReportsScreenProps {
    organizationId: string;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ organizationId }) => {
    const [showHistorical, setShowHistorical] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [programs, setPrograms] = useState<string[]>([]);
    const [availableReports, setAvailableReports] = useState<StorageReport[]>([]);


    useEffect(() => {
        const loadPrograms = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const programsQuery = query(
                collection(db, 'organizations', organizationId, 'programs')
            );
            const programDocs = await getDocs(programsQuery);
            const programNames = programDocs.docs.map(doc => doc.data().name);
            setPrograms(programNames);
        };
        loadPrograms();
    }, [organizationId]);

    useEffect(() => {
        if (showHistorical && organizationId) {
            const fetchReports = async () => {
                const storage = getStorage();
                const basePath = `organizations/${organizationId}/reports`;

                let reportsPath = '';
                switch (selectedReportType) {
                    case ReportType.ORGANIZATION:
                        reportsPath = `${basePath}/organization`;
                        break;
                    case ReportType.PROGRAM:
                        reportsPath = `${basePath}/programs`;
                        break;
                    case ReportType.RECAPS:
                        reportsPath = `${basePath}/recaps`;
                        break;
                    default:
                        return;
                }

                const reportsRef = ref(storage, reportsPath);
                const result = await listAll(reportsRef);
                const reportsData = await Promise.all(
                    result.items.map(async (item) => {
                        const metadata = await getMetadata(item);
                        return {
                            name: item.name,
                            path: item.fullPath,
                            timestamp: Date.parse(metadata.timeCreated)
                        };
                    })
                );
                setAvailableReports(reportsData.sort((a, b) => b.timestamp - a.timestamp));
            };

            fetchReports();
        }
    }, [showHistorical, selectedReportType, organizationId]);

    const downloadReport = async (path: string) => {
        const storage = getStorage();
        const reportRef = ref(storage, path);
        const url = await getDownloadURL(reportRef);
        window.open(url, '_blank');
    };

    if (showHistorical) {
        return (
            <div className="report-options">
                <div className="report-card">
                    <div className="header-row">
                        <h2>Historical Reports</h2>
                        <button
                            className="back-button"
                            onClick={() => setShowHistorical(false)}
                        >
                            Back to Current Reports
                        </button>
                    </div>

                    <hr />

                    <div className="report-type-buttons">
                        <ReportTypeButton
                            text="Organization Recaps"
                            selected={selectedReportType === ReportType.RECAPS}
                            onClick={() => setSelectedReportType(ReportType.RECAPS)}
                        />
                        <ReportTypeButton
                            text="Organization Wide"
                            selected={selectedReportType === ReportType.ORGANIZATION}
                            onClick={() => setSelectedReportType(ReportType.ORGANIZATION)}
                        />
                        <ReportTypeButton
                            text="Program Specific"
                            selected={selectedReportType === ReportType.PROGRAM}
                            onClick={() => setSelectedReportType(ReportType.PROGRAM)}
                        />
                    </div>

                    <hr />

                    <div className="reports-list">
                        {availableReports.map((report) => (
                            <div key={report.path} className="report-item">
                                <span>{report.name}</span>
                                <button
                                    onClick={() => downloadReport(report.path)}
                                    className="download-button"
                                    disabled={!organizationId}
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="report-options">
            <div className="header-row">
                <h2>Monthly Reports</h2>
                <button
                    className="view-past-button"
                    onClick={() => setShowHistorical(true)}
                    disabled={!organizationId}
                >
                    View Past Reports
                </button>
            </div>

            <hr/>

            <h3>Select Report Type</h3>

            <div className="report-type-buttons">
                <ReportTypeButton
                    text="Public Awareness/Impact Reports"
                    selected={selectedReportType === ReportType.RECAPS}
                    onClick={() => setSelectedReportType(ReportType.RECAPS)}
                />
                <ReportTypeButton
                    text="Peer Services Report"
                    selected={selectedReportType === ReportType.ORGANIZATION}
                    onClick={() => setSelectedReportType(ReportType.ORGANIZATION)}
                />
                <ReportTypeButton
                    text="Program Specific Report"
                    selected={selectedReportType === ReportType.PROGRAM}
                    onClick={() => setSelectedReportType(ReportType.PROGRAM)}
                />
            </div>

            {selectedReportType === ReportType.PROGRAM && (
                <select
                    value={selectedProgram || ''}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="program-select"
                    disabled={!organizationId}
                >
                    <option value="">Select Program</option>
                    {programs.map(program => (
                        <option key={program} value={program}>
                            {program}
                        </option>
                    ))}
                </select>
            )}

            <hr/>

            {renderReportContent(selectedReportType, selectedProgram)}
        </div>
    );
};
