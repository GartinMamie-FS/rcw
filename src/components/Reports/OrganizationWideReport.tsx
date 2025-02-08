import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    doc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { ServiceWithParticipantCount, ProgramWithParticipantCount, LocationWithParticipantCount } from './types';
import { jsPDF } from 'jspdf';
import './OrganizationWideReport.css';

interface OrganizationWideReportProps {}

export const OrganizationWideReport: React.FC<OrganizationWideReportProps> = () => {
    const { organizationId } = useOrganization();
    const [services, setServices] = useState<ServiceWithParticipantCount[]>([]);
    const [programs, setPrograms] = useState<ProgramWithParticipantCount[]>([]);
    const [locations, setLocations] = useState<LocationWithParticipantCount[]>([]);
    const [uniqueParticipants, setUniqueParticipants] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });



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
        const fetchData = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const serviceCountMap: { [key: string]: number } = {};
            const programCountMap: { [key: string]: number } = {};
            const locationCountMap: { [key: string]: number } = {};

            const [year, month] = selectedMonth.split('-');
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

            const participantsQuery = query(
                collection(db, 'organizations', organizationId, 'participants')
            );
            const participantsSnapshot = await getDocs(participantsQuery);

            const countedParticipants = new Set();

            for (const participantDoc of participantsSnapshot.docs) {
                const participantServicesRef = collection(
                    db,
                    'organizations',
                    organizationId,
                    'participants',
                    participantDoc.id,
                    'participantServices'
                );
                const participantServicesSnap = await getDocs(participantServicesRef);

                let hasServicesInMonth = false;

                participantServicesSnap.forEach(serviceDoc => {
                    const servicesData = serviceDoc.data();
                    const createdAt = servicesData.createdAt?.toDate() || new Date(servicesData.createdAt);

                    if (createdAt >= startOfMonth && createdAt <= endOfMonth) {
                        hasServicesInMonth = true;
                        const services = servicesData.services || [];
                        services.forEach((service: any) => {
                            if (service.serviceId) {
                                serviceCountMap[service.serviceId] = (serviceCountMap[service.serviceId] || 0) + (service.count || 1);
                            }
                        });
                    }
                });

                if (hasServicesInMonth) {
                    countedParticipants.add(participantDoc.id);
                }

                // Program and Location logic remains the same
                const programRef = collection(
                    db,
                    'organizations',
                    organizationId,
                    'participants',
                    participantDoc.id,
                    'participantProgram'
                );
                const programQuery = query(programRef, orderBy('createdAt', 'desc'), limit(1));
                const programSnap = await getDocs(programQuery);

                if (!programSnap.empty) {
                    const programData = programSnap.docs[0].data();
                    if (programData.programs && programData.programs.length > 0) {
                        const programId = programData.programs[0].programId;
                        programCountMap[programId] = (programCountMap[programId] || 0) + 1;
                    }
                }

                const locationRef = collection(
                    db,
                    'organizations',
                    organizationId,
                    'participants',
                    participantDoc.id,
                    'participantLocation'
                );
                const locationQuery = query(locationRef, orderBy('createdAt', 'desc'), limit(1));
                const locationSnap = await getDocs(locationQuery);

                if (!locationSnap.empty) {
                    const locationName = locationSnap.docs[0].data().location;
                    if (locationName) {
                        locationCountMap[locationName] = (locationCountMap[locationName] || 0) + 1;
                    }
                }
            }

            // Fetch and set services, programs, and locations data
            const servicesQuery = query(
                collection(db, 'organizations', organizationId, 'services')
            );
            const servicesSnapshot = await getDocs(servicesQuery);
            const servicesData = servicesSnapshot.docs.map(doc => ({
                name: doc.data().name,
                participantCount: serviceCountMap[doc.id] || 0
            }));

            const programsQuery = query(
                collection(db, 'organizations', organizationId, 'programs')
            );
            const programsSnapshot = await getDocs(programsQuery);
            const programsData = programsSnapshot.docs.map(doc => ({
                name: doc.data().name,
                participantCount: programCountMap[doc.id] || 0
            }));

            const locationsQuery = query(
                collection(db, 'organizations', organizationId, 'locations')
            );
            const locationsSnapshot = await getDocs(locationsQuery);
            const locationsData = locationsSnapshot.docs.map(doc => ({
                name: doc.data().name,
                participantCount: locationCountMap[doc.data().name] || 0
            }));

            setServices(servicesData);
            setPrograms(programsData);
            setLocations(locationsData);
            setUniqueParticipants(countedParticipants.size);
        };

        fetchData();
    }, [organizationId, selectedMonth]);


    const generatePDF = () => {
        const doc = new jsPDF();
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear().toString();

        doc.setFontSize(18);
        doc.text('Organization Wide Report', 105, 20, { align: 'center' });

        let yPos = 40;
        doc.setFontSize(14);
        doc.text('Services', 20, yPos);
        yPos += 10;
        services.forEach(service => {
            doc.text(`${service.name}: ${service.participantCount}`, 20, yPos);
            yPos += 10;
        });

        yPos += 10;
        doc.text('Programs', 20, yPos);
        yPos += 10;
        programs.forEach(program => {
            doc.text(`${program.name}: ${program.participantCount}`, 20, yPos);
            yPos += 10;
        });

        yPos += 10;
        doc.text('Locations', 20, yPos);
        yPos += 10;
        locations.forEach(location => {
            doc.text(`${location.name}: ${location.participantCount}`, 20, yPos);
            yPos += 10;
        });

        yPos += 10;
        doc.text(`Un-Duplicated Participants: ${uniqueParticipants}`, 20, yPos);

        doc.save(`MonthlyReport_${currentMonth}_${currentYear}.pdf`);
        return doc.output('arraybuffer');
    };

    const saveEndOfMonthReport = async () => {
        if (!organizationId) return;

        const confirmed = window.confirm(
            "Would you like to save this month's organization report?"
        );

        if (!confirmed) return;

        setIsSaving(true);
        try {
            const db = getFirestore();
            const storage = getStorage();

            // Use selectedMonth instead of current date
            const [year, month] = selectedMonth.split('-');
            const reportDate = new Date(parseInt(year), parseInt(month) - 1);
            const reportMonth = reportDate.toLocaleString('default', { month: 'long' });
            const reportYear = reportDate.getFullYear().toString();

            const pdfBytes = generatePDF();

            const storageRef = ref(storage, `organizations/${organizationId}/reports/organization/${reportMonth}${reportYear}.pdf`);
            await uploadBytes(storageRef, pdfBytes);

            await setDoc(
                doc(db, 'organizations', organizationId, 'monthlyReports', `${reportMonth}-${reportYear}`),
                {
                    organizationReport: true,
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
        <div className="organization-report">
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
                    onClick={() => generatePDF()}
                    className="generate-pdf-button"
                >
                    Generate PDF Report
                </button>
            </div>

            <div className="report-grid">
                <div className="report-card">
                    <h3>Services</h3>
                    <div className="report-list">
                        {services.map(service => (
                            <div key={service.name} className="report-item">
                                <span>{service.name}</span>
                                <span>{service.participantCount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="report-card">
                    <h3>Programs</h3>
                    <div className="report-list">
                        {programs.map(program => (
                            <div key={program.name} className="report-item">
                                <span>{program.name}</span>
                                <span>{program.participantCount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="report-card">
                    <h3>Locations</h3>
                    <div className="report-list">
                        {locations.map(location => (
                            <div key={location.name} className="report-item">
                                <span>{location.name}</span>
                                <span>{location.participantCount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="total-card">
                <h3>Un-Duplicated Individuals</h3>
                <span>{uniqueParticipants}</span>
            </div>
        </div>
    );
};

