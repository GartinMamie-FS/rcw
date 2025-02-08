import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, query, orderBy, getDocs} from 'firebase/firestore';
import './DocumentSection.css';

interface Document {
    date: string;
    name: string;
    fileUrl: string;
    organizationId: string;
}

interface DocumentWithId {
    id: string;
    document: Document;
}

export const DocumentsSection: React.FC<{ participantId: string, onAddClick: () => void }> = ({
                                                                                                  participantId,
                                                                                                  onAddClick
                                                                                              }) => {
    const { organizationId } = useOrganization();
    const [documents, setDocuments] = useState<DocumentWithId[]>([]);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const docsQuery = query(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantDocuments'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(docsQuery);
            const docsData = snapshot.docs.map(doc => ({
                id: doc.id,
                document: doc.data() as Document
            }));

            setDocuments(docsData);
        };

        fetchDocuments();
    }, [participantId, organizationId]);

    return (
        <div className="documents-section">
            <div className="section-header">
                <h3>Document Manager</h3>
                <button
                    onClick={onAddClick}
                    className="add-button"
                    disabled={!organizationId}
                >
                    Add New Document
                </button>
            </div>

            <div className="documents-table">
                <div className="table-header">
                    <div className="header-cell" style={{flex: 1}}>Date</div>
                    <div className="header-cell" style={{flex: 2}}>Document Name</div>
                    <div className="header-cell" style={{flex: 0.5}}>Action</div>
                </div>

                <div className="table-body">
                    {documents.map(doc => (
                        <div key={doc.id} className="table-row">
                            <div className="table-cell" style={{flex: 1}}>{doc.document.date}</div>
                            <div className="table-cell" style={{flex: 2}}>{doc.document.name}</div>
                            <div className="table-cell" style={{flex: 0.5}}>
                                <button
                                    onClick={() => window.open(doc.document.fileUrl, '_blank')}
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
        </div>
    );
};
