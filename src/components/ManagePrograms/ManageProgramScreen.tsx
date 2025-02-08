import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, updateDoc} from 'firebase/firestore';
import './ManagePrograms.css';
import { ProgramDetailsScreen } from './ProgramDetailsScreen';

interface Program {
    name: string;
    organizationId: string;
}

interface ProgramWithId {
    id: string;
    program: Program;
    date: string;
}

interface ManageProgramsScreenProps {
    organizationId: string;
}

export const ManageProgramsScreen: React.FC<ManageProgramsScreenProps> = ({ organizationId }) => {
    const [showProgramForm, setShowProgramForm] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

    const renderContent = () => {
        if (showProgramForm) {
            return (
                <CreateProgramForm
                    organizationId={organizationId}
                    onSaveComplete={() => setShowProgramForm(false)}
                />
            );
        }

        if (selectedProgramId) {
            return (
                <ProgramDetailsScreen
                    organizationId={organizationId}
                    programId={selectedProgramId}
                    onBack={() => setSelectedProgramId(null)}
                />
            );
        }

        return (
            <div className="manage-programs-screen">
                <div className="header-container">
                    <h2>Manage Programs</h2>
                    <button
                        className="create-button"
                        onClick={() => setShowProgramForm(true)}
                    >
                        Create New Program
                    </button>
                </div>
                <ProgramsTable
                    organizationId={organizationId}
                    onNavigateToDetails={(programId) => setSelectedProgramId(programId)}
                />
            </div>
        );
    };

    return renderContent();
};


interface ProgramsTableProps {
    organizationId: string;
    onNavigateToDetails: (programId: string) => void;
}

// The main component structure stays the same, just update the ProgramsTable component:

const ProgramsTable: React.FC<ProgramsTableProps> = ({ organizationId, onNavigateToDetails }) => {
    const [programs, setPrograms] = useState<ProgramWithId[]>([]);

    useEffect(() => {
        const loadPrograms = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const programsRef = collection(db, 'organizations', organizationId, 'programs');
            const snapshot = await getDocs(programsRef);
            const programsList = snapshot.docs.map(doc => ({
                id: doc.id,
                program: {
                    name: doc.data().name,
                    organizationId
                },
                date: doc.data().date || ''
            }));
            setPrograms(programsList);
        };

        loadPrograms();
    }, [organizationId]);

    return (
        <div className="manage-programs-screen">
            <div className="programs-table">
                <div className="table-header">
                    <span>Program</span>
                    <span>Action</span>
                </div>
                {programs.map(prog => (
                    <div key={prog.id} className="table-row">
                        <span>{prog.program.name}</span>
                        <button
                            onClick={() => onNavigateToDetails(prog.id)}
                            className="view-button"
                        >
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};



interface CreateProgramFormProps {
    organizationId: string;
    onSaveComplete: () => void;
}

const CreateProgramForm: React.FC<CreateProgramFormProps> = ({ organizationId, onSaveComplete }) => {
    const [programName, setProgramName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationId) return;

        const db = getFirestore();
        const currentDate = new Date().toLocaleDateString();

        // Create program in organization's programs subcollection
        const programRef = await addDoc(
            collection(db, 'organizations', organizationId, 'programs'),
            {
                name: programName,
                date: currentDate,
                createdAt: new Date()
            }
        );

        // Update participant programs if needed
        const participantsRef = collection(db, 'organizations', organizationId, 'participants');
        const participantsSnapshot = await getDocs(participantsRef);

        for (const participantDoc of participantsSnapshot.docs) {
            const participantProgramsRef = collection(participantsRef, participantDoc.id, 'participantProgram');
            const programsSnapshot = await getDocs(participantProgramsRef);

            for (const programDoc of programsSnapshot.docs) {
                const programs = programDoc.data().programs as Array<{ programId: string }>;
                if (programs?.some(p => p.programId === programRef.id)) {
                    const updatedPrograms = programs.map(prog =>
                        prog.programId === programRef.id
                            ? { ...prog, programName: programName }
                            : prog
                    );
                    await updateDoc(programDoc.ref, {
                        programs: updatedPrograms
                    });
                }
            }
        }

        onSaveComplete();
    };

    return (
        <div className="manage-programs-screen">
            <h2>Create New Program</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Program Name</label>
                    <input
                        type="text"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        placeholder="Enter program name"
                        className="form-input"
                    />
                </div>

                <div className="button-container">
                    <button
                        type="submit"
                        className="form-button"
                        disabled={!programName.trim() || !organizationId}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onSaveComplete}
                        className="form-button"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
