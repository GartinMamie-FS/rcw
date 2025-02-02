import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { format } from 'date-fns';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,

    serverTimestamp
} from 'firebase/firestore';
import './ManageProgram.css';

interface Program {
    name: string;
    organizationId: string;
}

interface ProgramWithId {
    id: string;
    program: Program;
}

export const ManageProgram: React.FC<{
    participantId: string;
    onSaveComplete: () => void;
}> = ({ participantId, onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'MM/dd/yyyy'));
    const [programs, setPrograms] = useState<ProgramWithId[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<ProgramWithId | null>(null);


    useEffect(() => {
        const fetchPrograms = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const programsRef = collection(db, 'organizations', organizationId, 'programs');
            const snapshot = await getDocs(programsRef);
            const programsData = snapshot.docs.map(doc => ({
                id: doc.id,
                program: doc.data() as Program
            }));
            setPrograms(programsData);
        };

        fetchPrograms();
    }, [organizationId]);

    const handleSave = async () => {
        const db = getFirestore();

        const formattedDate = format(new Date(), 'MM/dd/yyyy');

        const programData = {
            createdAt: serverTimestamp(),
            programs: [{
                assignedAt: formattedDate,
                programId: selectedProgram?.id,
                programName: selectedProgram?.program.name,
                updatedAt: formattedDate
            }]
        };

        try {
            await addDoc(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantProgram'),
                programData
            );

            await setDoc(
                doc(db, 'organizations', organizationId, 'participants', participantId, 'lastEngagement', 'current'),
                {
                    date: formattedDate,
                    type: 'program',
                    updatedAt: serverTimestamp()
                }
            );

            onSaveComplete();
        } catch (error) {
            console.error('Error saving:', error);
        }
    };



    return (
        <div className="manage-program">
            <h3>Manage Program</h3>

            <div className="form-group">
                <label>Managed services assignment or change date *</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Please select Program ID assignment</label>
                <label>Select Program ID(s)</label>
                <select
                    value={selectedProgram?.id || ''}
                    onChange={(e) => {
                        const program = programs.find(p => p.id === e.target.value);
                        setSelectedProgram(program || null);
                    }}
                    disabled={!organizationId}
                >
                    <option value="">Select Program</option>
                    {programs.map(program => (
                        <option key={program.id} value={program.id}>
                            {program.program.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleSave}
                disabled={!selectedDate || !selectedProgram || !organizationId}
                className="save-button"
            >
                Save
            </button>
        </div>
    );
};
