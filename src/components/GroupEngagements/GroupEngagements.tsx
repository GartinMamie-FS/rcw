import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import './GroupEngagements.css';
import { ServiceSelectionContent } from './ServiceSelectionContent';
import { ParticipantSelectionContent } from './ParticipantSelectionContent';
import { useOrganization } from '../../context/OrganizationContext';

enum EngagementStep {
    NONE = 'NONE',
    SERVICE_SELECTION = 'SERVICE_SELECTION',
    PARTICIPANT_SELECTION = 'PARTICIPANT_SELECTION'
}

interface ParticipantWithSelection {
    id: string;
    firstName: string;
    lastName: string;
    isSelected: boolean;
}

export const GroupEngagementsScreen: React.FC<{
    onNavigateToParticipants: () => void;
}> = ({ onNavigateToParticipants }) => {
    const { organizationId } = useOrganization();
    const [currentStep, setCurrentStep] = useState<EngagementStep>(EngagementStep.NONE);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedParticipants, setSelectedParticipants] = useState<ParticipantWithSelection[]>([]);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [services, setServices] = useState<string[]>([]);

    useEffect(() => {
        setCurrentStep(EngagementStep.SERVICE_SELECTION);
        loadServices();
    }, [organizationId]);

    const loadServices = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        const servicesQuery = query(
            collection(db, 'services'),
            where('organizationId', '==', organizationId)
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        const servicesList = servicesSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
        setServices(servicesList);
    };

    const saveEngagements = async () => {
        if (!selectedService || !organizationId) return;

        const db = getFirestore();
        const currentDate = format(new Date(), 'MM/dd/yyyy');

        const serviceQuery = query(
            collection(db, 'services'),
            where('name', '==', selectedService),
            where('organizationId', '==', organizationId)
        );
        const serviceDoc = (await getDocs(serviceQuery)).docs[0];
        const serviceId = serviceDoc.id;

        for (const participant of selectedParticipants.filter((p: ParticipantWithSelection) => p.isSelected)) {
            await addDoc(
                collection(db, 'participants', participant.id, 'participantServices'),
                {
                    createdAt: new Date(),
                    organizationId,
                    services: [{
                        serviceId,
                        serviceName: selectedService
                    }]
                }
            );

            await setDoc(
                doc(db, 'participants', participant.id, 'lastEngagement', 'current'),
                {
                    date: currentDate,
                    type: 'service',
                    organizationId,
                    updatedAt: new Date()
                }
            );
        }

        setShowSuccessDialog(true);
    };
    return (
        <div className="group-engagements">
            <h2>Group Engagements</h2>

            <div className="content-grid">
                {/* Navigation Card */}
                <div className="nav-card">
                    <button
                        onClick={() => setCurrentStep(EngagementStep.SERVICE_SELECTION)}
                        className="nav-button"
                    >
                        Group Engagement
                    </button>

                    <button
                        onClick={() => setCurrentStep(EngagementStep.PARTICIPANT_SELECTION)}
                        disabled={!selectedService}
                        className="nav-button"
                    >
                        Peers Who Engaged
                    </button>

                    <button
                        onClick={saveEngagements}
                        disabled={!selectedService || !selectedParticipants.some(p => p.isSelected)}
                        className="submit-button"
                    >
                        Submit
                    </button>
                </div>

                {/* Content Card */}
                <div className="content-card">
                    {currentStep === EngagementStep.SERVICE_SELECTION && (
                        <ServiceSelectionContent
                            services={services}
                            onServiceSelected={(service) => {
                                setSelectedService(service);
                                setCurrentStep(EngagementStep.PARTICIPANT_SELECTION);
                            }}
                        />
                    )}

                    {currentStep === EngagementStep.PARTICIPANT_SELECTION && (
                        <ParticipantSelectionContent
                            serviceName={selectedService!}
                            participants={selectedParticipants}
                            onParticipantsSelected={setSelectedParticipants}
                        />
                    )}
                </div>
            </div>

            {showSuccessDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Success</h3>
                        <p>Service added to selected participants</p>
                        <button onClick={() => {
                            setShowSuccessDialog(false);
                            onNavigateToParticipants();
                        }}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
