import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, orderBy, getDocs} from 'firebase/firestore';
import './NotesSection.css';
import { ViewNote } from './ViewNote';

interface NoteWithId {
    id: string;
    location: string;
    completionDate: string;
    staffNote: string;
    staffName: string;
    organizationId: string;
}

interface NotesSectionProps {
    participantId: string;
    onAddClick: () => void;
    onViewNote: (note: NoteWithId) => void;
    refreshTrigger: number;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
                                                              participantId,
                                                              onAddClick,
                                                              refreshTrigger
                                                          }) => {
    const { organizationId } = useOrganization();
    const [notes, setNotes] = useState<NoteWithId[]>([]);
    const [selectedNote, setSelectedNote] = useState<NoteWithId | null>(null);

    useEffect(() => {
        const fetchNotes = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const notesQuery = query(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantNotes'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(notesQuery);
            const notesData = snapshot.docs.map(doc => ({
                id: doc.id,
                location: doc.data().location || '',
                completionDate: doc.data().completionDate || '',
                staffName: doc.data().staffName || '',
                staffNote: doc.data().staffNote || '',
                organizationId: doc.data().organizationId
            }));

            setNotes(notesData);
        };


        fetchNotes();
    }, [participantId, refreshTrigger, organizationId]);

    return (
        <div className="notes-section">
            {selectedNote ? (
                <ViewNote
                    note={selectedNote}
                    onClose={() => setSelectedNote(null)}
                />
            ) : (
                <>
                    <div className="section-header">
                        <h3>Peer Notes</h3>
                        <button
                            onClick={onAddClick}
                            className="add-button"
                            disabled={!organizationId}
                        >
                            Add Notes
                        </button>
                    </div>

                    <div className="notes-table">
                        <div className="table-header">
                            <div className="header-cell" style={{ flex: 1 }}>Date</div>
                            <div className="header-cell" style={{ flex: 1 }}>Location</div>
                            <div className="header-cell" style={{ flex: 1 }}>Staff</div>
                            <div className="header-cell" style={{ flex: 2 }}>Notes</div>
                            <div className="header-cell" style={{ flex: 0.5 }}>Action</div>
                        </div>

                        <div className="table-body">
                            {notes.map(note => (
                                <div key={note.id} className="table-row">
                                    <div className="table-cell" style={{ flex: 1 }}>
                                        {note.completionDate}
                                    </div>
                                    <div className="table-cell" style={{ flex: 1 }}>
                                        {note.location}
                                    </div>
                                    <div className="table-cell" style={{ flex: 1 }}>
                                        {note.staffName}
                                    </div>
                                    <div className="table-cell note-content" style={{ flex: 2 }}>
                                        {note.staffNote}
                                    </div>
                                    <div className="table-cell" style={{ flex: 0.5 }}>
                                        <button
                                            onClick={() => setSelectedNote(note)}
                                            className="view-button"
                                            disabled={!organizationId}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
