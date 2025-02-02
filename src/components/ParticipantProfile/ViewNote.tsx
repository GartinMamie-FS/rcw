import { useOrganization } from '../../context/OrganizationContext';
import './ViewNote.css';

interface ViewNoteProps {
    note: {
        completionDate: string;
        location: string;
        staffName: string;
        staffNote: string;
        organizationId: string;
    };
    onClose: () => void;
}

export const ViewNote: React.FC<ViewNoteProps> = ({ note, onClose }) => {
    const { organizationId } = useOrganization();

    return (
        <div className="view-note">
            <div className="note-header">
                <h3>Peer Note</h3>
                <button
                    onClick={onClose}
                    className="close-button"
                    disabled={!organizationId}
                >
                    Close Note
                </button>
            </div>

            <div className="note-info">
                <div className="info-row">
                    <div className="info-column">
                        <h4>Date Created</h4>
                        <div className="info-card">
                            {note.completionDate}
                        </div>
                    </div>

                    <div className="info-column">
                        <h4>Location</h4>
                        <div className="info-card">
                            {note.location}
                        </div>
                    </div>

                    <div className="info-column">
                        <h4>Staff Member</h4>
                        <div className="info-card">
                            {note.staffName}
                        </div>
                    </div>
                </div>

                <div className="note-content">
                    <h4>Staff Note</h4>
                    <div className="content-card">
                        {note.staffNote}
                    </div>
                </div>
            </div>
        </div>
    );
};
