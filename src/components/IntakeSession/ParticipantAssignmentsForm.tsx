import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';

interface ParticipantAssignmentsFormProps {
    participantId: string;
    onComplete: () => void;
    organizationId: string;  // Add this line
}

interface Program {
    name: string;
    organizationId: string;
}

interface ProgramWithId {
    id: string;
    program: Program;
}

export const ParticipantAssignmentsForm: React.FC<ParticipantAssignmentsFormProps> = ({
                                                                                          participantId,
                                                                                          onComplete
                                                                                      }) => {
    const { organizationId } = useOrganization();
    const [programs, setPrograms] = useState<ProgramWithId[]>([]);
    const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (organizationId) {
            loadPrograms();
        }
    }, [organizationId]);

    const loadPrograms = async () => {
        const db = getFirestore();
        const programsQuery = query(
            collection(db, 'programs'),
            where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(programsQuery);
        const programsList = snapshot.docs.map(doc => ({
            id: doc.id,
            program: doc.data() as Program
        }));
        setPrograms(programsList);
    };

    const saveParticipantPrograms = async () => {
        const db = getFirestore();

        const selectedProgramDetails = Array.from(selectedPrograms).map(programId => {
            const program = programs.find(p => p.id === programId)?.program;
            return {
                programId,
                programName: program?.name || '',
                assignedAt: new Date()
            };
        });

        const programData = {
            programs: selectedProgramDetails,
            organizationId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await addDoc(
            collection(db, 'participants', participantId, 'participantProgram'),
            programData
        );

        onComplete();
    };
    return (
        <div className="assignments-form">
            <h2>Participant Assignments</h2>
            <p className="required-text">* indicates required field</p>

            <div className="form-section">
                <h3>Select and assign Program ID(s)</h3>
                <p>Assign applicable Program IDs needed for this participant. Select all that apply.</p>

                <div className="multi-select">
                    <div
                        className="select-header"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span>
                            {selectedPrograms.size === 0
                                ? 'Select Programs *'
                                : `${selectedPrograms.size} selected`}
                        </span>
                        <span className={`arrow ${isDropdownOpen ? 'up' : 'down'}`}>▼</span>
                    </div>

                    {isDropdownOpen && (
                        <div className="select-options">
                            {programs.map(({ id, program }) => (
                                <div
                                    key={id}
                                    className="select-option"
                                    onClick={() => {
                                        const newSelection = new Set(selectedPrograms);
                                        if (newSelection.has(id)) {
                                            newSelection.delete(id);
                                        } else {
                                            newSelection.add(id);
                                        }
                                        setSelectedPrograms(newSelection);
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPrograms.has(id)}
                                        readOnly
                                    />
                                    <span>{program.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                className="save-button"
                disabled={selectedPrograms.size === 0}
                onClick={saveParticipantPrograms}
            >
                Done
            </button>
        </div>
    );
};