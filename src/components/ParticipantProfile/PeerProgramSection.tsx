import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, orderBy, getDocs} from 'firebase/firestore';
import './PeerProgramSection.css';

interface Program {
    name: string;
}

interface ProgramWithId {
    id: string;
    program: Program;
    date: string;
}

export const PeerProgramSection: React.FC<{
    participantId: string;
    onManageClick: () => void;
}> = ({ participantId, onManageClick }) => {
    const { organizationId } = useOrganization();
    const [programs, setPrograms] = useState<ProgramWithId[]>([]);

    useEffect(() => {
        const fetchPrograms = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const programsQuery = query(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantProgram'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(programsQuery);
            const programsData = snapshot.docs.flatMap(doc => {
                const data = doc.data();
                const programsList = data.programs || [];
                return programsList.map((program: any) => ({
                    id: program.programId,
                    program: {
                        name: program.programName
                    },
                    date: program.assignedAt
                }));
            });

            console.log('Fetched programs:', programsData); // Add this to verify data
            setPrograms(programsData);
        };

        fetchPrograms();
    }, [participantId, organizationId]);

    return (
        <div className="peer-program-section">
            <div className="section-header">
                <h3>Peer Program</h3>
                <button
                    onClick={onManageClick}
                    className="manage-button"
                    disabled={!organizationId}
                >
                    Manage Program
                </button>
            </div>

            <div className="current-program">
                <h3>Current Program</h3>

                <div className="programs-table">
                    <div className="table-header">
                        <div className="header-cell">Date</div>
                        <div className="header-cell">Program</div>
                    </div>

                    <div className="table-body">
                        {programs.map((program, index) => (
                            <div key={`${program.id}-${index}`} className="table-row">
                                <div className="table-cell">{program.date}</div>
                                <div className="table-cell">{program.program.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
