import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, collection, getDocs} from 'firebase/firestore';
import './ProgramDetailsScreen.css';

interface ProgramDetailsProps {
    programId: string;
    onBack: () => void;
}

interface Program {
    name: string;
    date: string;
    organizationId: string;
}

interface ProgramDetailsProps {
    programId: string;
    organizationId: string;
    onBack: () => void;
}

export const ProgramDetailsScreen: React.FC<ProgramDetailsProps> = ({
                                                                        programId,
                                                                        organizationId,
                                                                        onBack
                                                                    }) => {
    const [program, setProgram] = useState<Program | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [programName, setProgramName] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const loadProgram = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const docRef = doc(db, 'organizations', organizationId, 'programs', programId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProgram({
                    name: data.name,
                    date: data.date,
                    organizationId: organizationId
                });
                setProgramName(data.name);
            }
        };

        loadProgram();
    }, [programId, organizationId]);

    const handleSave = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        const programRef = doc(db, 'organizations', organizationId, 'programs', programId);
        await updateDoc(programRef, {
            name: programName,
            updatedAt: new Date()
        });

        // Update participant programs
        const participantsRef = collection(db, 'organizations', organizationId, 'participants');
        const participantsSnapshot = await getDocs(participantsRef);

        for (const participantDoc of participantsSnapshot.docs) {
            const programsRef = collection(participantsRef, participantDoc.id, 'participantProgram');
            const programsSnapshot = await getDocs(programsRef);

            for (const programDoc of programsSnapshot.docs) {
                const programs = programDoc.data().programs;
                if (programs?.some((p: any) => p.programId === programId)) {
                    const updatedPrograms = programs.map((p: any) =>
                        p.programId === programId ? { ...p, programName: programName } : p
                    );
                    await updateDoc(programDoc.ref, {
                        programs: updatedPrograms
                    });
                }
            }
        }

        setIsEditing(false);
        setProgram(prev => prev ? { ...prev, name: programName } : null);
    };

    const handleDelete = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        await deleteDoc(doc(db, 'organizations', organizationId, 'programs', programId));
        setShowDeleteDialog(false);
        onBack();
    };

    return (
        <div className="program-details-screen">
            <div className="header">
                <button onClick={onBack} className="back-button">
                    ← Back
                </button>
                <h2>{isEditing ? 'Edit Program' : 'Program Details'}</h2>
            </div>

            {program && (
                <>
                    {isEditing ? (
                        <>
                            <div className="form-group">
                                <label>Program Name</label>
                                <input
                                    type="text"
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="button-container">
                                <button onClick={handleSave} className="form-button">
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="form-button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Program Name</label>
                                <div className="form-value">{program.name}</div>
                            </div>

                            <div className="button-container">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="form-button"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="form-button delete"
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {showDeleteDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete this program?</p>
                        <div className="dialog-buttons">
                            <button onClick={handleDelete} className="form-button delete">
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="form-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
