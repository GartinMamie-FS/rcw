import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, getDocs, doc, updateDoc} from 'firebase/firestore';
import './EditPeerProfile.css'

interface EditPeerProfileProps {
    participantId: string;
    onSaveComplete: () => void;
}

export const EditPeerProfile: React.FC<EditPeerProfileProps> = ({ participantId, onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const fetchParticipantInfo = async () => {
            if (participantId && organizationId) {
                const db = getFirestore();
                const participantRef = collection(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation');
                const snapshot = await getDocs(participantRef);

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setFirstName(doc.data().firstName || '');
                    setLastName(doc.data().lastName || '');
                    setDateOfBirth(doc.data().dateOfBirth || '');
                    setPhone(doc.data().phone || '');
                    setEmail(doc.data().email || '');
                    setAddress(doc.data().address || '');
                }
            }
        };

        fetchParticipantInfo();
    }, [participantId, organizationId]);

    const handleSave = async () => {
        if (!organizationId) return;

        const db = getFirestore();
        const data = {
            firstName,
            lastName,
            dateOfBirth,
            phone,
            email,
            address,
            updatedAt: new Date()
        };

        const participantRef = collection(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation');
        const snapshot = await getDocs(participantRef);

        if (!snapshot.empty) {
            await updateDoc(doc(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation', snapshot.docs[0].id), data);
        }

        onSaveComplete();
    };

    return (
        <div className="participant-form">
            <h2>Edit Profile Information</h2>

            <div className="form-group">
                <label>First Name</label>
                <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Last Name</label>
                <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Date of Birth</label>
                <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Phone Number</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Address</label>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                />
            </div>

            <button
                className="save-button"
                onClick={handleSave}
                disabled={!organizationId}
            >
                Save Changes
            </button>
        </div>
    );
};
