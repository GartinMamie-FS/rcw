import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import { ServiceWithParticipantCount, LocationWithParticipantCount } from './types';
import './Reports.css';

interface ProgramSpecificReportProps {
    programName: string;
}

export const ProgramSpecificReport: React.FC<ProgramSpecificReportProps> = ({ programName }) => {
    const {organizationId} = useOrganization();
    const [services, setServices] = useState<ServiceWithParticipantCount[]>([]);
    const [locations, setLocations] = useState<LocationWithParticipantCount[]>([]);
    const [programParticipants, setProgramParticipants] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [canSaveReport] = useState(isWithinEndOfMonthRange());
    const currentMonth = new Date().toLocaleString('default', {month: 'long'});

    useEffect(() => {
        if (!programName || !organizationId) return;

        const fetchProgramData = async () => {
            const db = getFirestore();
            setServices([]);
            setLocations([]);
            const serviceCountMap: { [key: string]: number } = {};
            const locationCountMap: { [key: string]: number } = {};

            const programsRef = collection(db, 'organizations', organizationId, 'programs');
            const programQuery = query(programsRef, where('name', '==', programName));
            const programDoc = await getDocs(programQuery);
            const programId = programDoc.docs[0]?.id;

            if (programId) {
                const servicesRef = collection(db, 'organizations', organizationId, 'services');
                const locationsRef = collection(db, 'organizations', organizationId, 'locations');

                const servicesCollection = await getDocs(servicesRef);
                const locationsCollection = await getDocs(locationsRef);

                servicesCollection.docs.forEach(serviceDoc => {
                    serviceCountMap[serviceDoc.id] = 0;
                });

                locationsCollection.docs.forEach(locationDoc => {
                    locationCountMap[locationDoc.data().name || ''] = 0;
                });

                let participantCount = 0;
                const participantsRef = collection(db, 'organizations', organizationId, 'participants');
                const participantsCollection = await getDocs(participantsRef);

                for (const participantDoc of participantsCollection.docs) {
                    const programSnapshot = await getDocs(
                        query(
                            collection(db, 'organizations', organizationId, 'participants', participantDoc.id, 'participantProgram'),
                            orderBy('createdAt', 'desc'),
                            limit(1)
                        )
                    );

                    const currentProgramDoc = programSnapshot.docs[0];
                    const programsList = currentProgramDoc?.data()?.programs;
                    const isInProgram = programsList?.[0]?.programId === programId;

                    if (isInProgram) {
                        const lastEngagementRef = doc(db, 'organizations', organizationId, 'participants', participantDoc.id, 'lastEngagement', 'current');
                        const lastEngagement = await getDoc(lastEngagementRef);
                        const engagementDate = lastEngagement.data()?.date;

                        if (isDateInSelectedMonth(engagementDate, currentMonth)) {
                            participantCount++;

                            const participantServices = await getDocs(
                                collection(db, 'organizations', organizationId, 'participants', participantDoc.id, 'participantServices')
                            );

                            participantServices.docs.forEach(serviceDoc => {
                                const servicesData = serviceDoc.data().services;
                                if (Array.isArray(servicesData)) {
                                    servicesData.forEach(service => {
                                        const serviceId = service.serviceId;
                                        if (serviceId) {
                                            serviceCountMap[serviceId] = (serviceCountMap[serviceId] || 0) + 1;
                                        }
                                    });
                                }
                            });

                            const participantLocation = await getDocs(
                                query(
                                    collection(db, 'organizations', organizationId, 'participants', participantDoc.id, 'participantLocation'),
                                    orderBy('createdAt', 'desc'),
                                    limit(1)
                                )
                            );

                            const currentLocation = participantLocation.docs[0]?.data().location;
                            if (currentLocation) {
                                locationCountMap[currentLocation] = (locationCountMap[currentLocation] || 0) + 1;
                            }
                        }
                    }
                }

                setProgramParticipants(participantCount);

                const servicesData = servicesCollection.docs.map(serviceDoc => ({
                    name: serviceDoc.data().name || '',
                    participantCount: serviceCountMap[serviceDoc.id] || 0
                }));
                setServices(servicesData);

                const locationsData = locationsCollection.docs.map(locationDoc => ({
                    name: locationDoc.data().name || '',
                    participantCount: locationCountMap[locationDoc.data().name || ''] || 0
                }));
                setLocations(locationsData);
            }
        };

        fetchProgramData();
    }, [programName, currentMonth, organizationId]);

    const generatePDF = () => {
        const doc = new jsPDF();
        const currentMonth = new Date().toLocaleString('default', {month: 'long'});
        const currentYear = new Date().getFullYear().toString();

        doc.setFontSize(18);
        doc.text(`${programName} Program Report`, 105, 20, {align: 'center'});

        let yPos = 40;

        doc.setFontSize(14);
        doc.text('Services', 20, yPos);
        yPos += 10;
        services.forEach(service => {
            doc.text(`${service.name}: ${service.participantCount}`, 20, yPos);
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
        doc.text(`Un-Duplicated Program Participants: ${programParticipants}`, 20, yPos);

        doc.save(`${programName}Report_${currentMonth}_${currentYear}.pdf`);
        return doc.output('arraybuffer');
    };

    const saveProgramReport = async () => {
        if (!organizationId) {
            console.log('No organization ID available');
            return;
        }

        setIsSaving(true);
        console.log('Starting save process...');

        try {
            const db = getFirestore();
            const storage = getStorage();
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });
            const currentYear = new Date().getFullYear().toString();
            console.log('Generating PDF...');

            const pdfBytes = generatePDF();
            console.log('PDF generated successfully');

            const storageRef = ref(storage,
                `organizations/${organizationId}/reports/programs/${programName}_${currentMonth}${currentYear}.pdf`
            );
            console.log('Uploading to storage path:', storageRef.fullPath);

            await uploadBytes(storageRef, pdfBytes);
            console.log('PDF uploaded successfully');

            const monthlyReportRef = doc(db, 'organizations', organizationId, 'monthlyReports', `${currentMonth}-${currentYear}`);
            await setDoc(monthlyReportRef, {
                programReports: true,
                lastUpdated: serverTimestamp()
            }, { merge: true });
            console.log('Monthly report document updated');

            return true;
        } catch (error) {
            console.error('Error saving report:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="program-report">
            <div className="report-actions">
                <button
                    className="save-report-button"
                    onClick={saveProgramReport}
                    disabled={!canSaveReport || isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Program Specific Report'}
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
                <h3>Un-Duplicated Program Participants</h3>
                <span>{programParticipants}</span>
            </div>
        </div>
    );
};

    function isWithinEndOfMonthRange(): boolean {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    return currentDay >= lastDay - 3 || currentDay <= 3;
}

function isDateInSelectedMonth(dateStr: string | undefined, selectedMonth: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long' }) === selectedMonth;
}
