import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import './ProfileSection.css'

interface ParticipantDetails {
    name: string;
    dob: string;
    phone: string;
    email: string;
    address: string;
}

interface ProfileSectionProps {
    participantId: string;
    onEditClick: () => void;
}

const ProfileField = ({ label, value }: { label: string; value: string }) => (
    <div className="profile-field">
        <div className="label-container">
            {label}:
        </div>
        <div className="value-underline">
            {value}
        </div>
    </div>
);

export const ProfileSection: React.FC<ProfileSectionProps> = ({ participantId, onEditClick }) => {
    const { organizationId } = useOrganization();
    const [participantDetails, setParticipantDetails] = useState<ParticipantDetails>({
        name: '',
        dob: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!organizationId || !participantId) return;

            const db = getFirestore();
            const profileQuery = query(
                collection(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(profileQuery);

            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setParticipantDetails({
                    name: `${data.firstName} ${data.lastName}`,
                    dob: data.dateOfBirth || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || ''
                });
            }
        };

        fetchProfile();
    }, [participantId, organizationId]);

    return (
        <div className="profile-section">
            <div className="header-row">
                <h2>Peer Profile</h2>
                <button
                    onClick={onEditClick}
                    className="edit-button"
                    disabled={!organizationId}
                >
                    <span className="edit-icon">✎</span>
                    Edit Profile
                </button>
            </div>

            <hr className="divider" />

            <div className="profile-fields">
                <ProfileField label="Name" value={participantDetails.name} />
                <ProfileField label="DOB" value={participantDetails.dob} />
                <ProfileField label="Phone Number" value={participantDetails.phone} />
                <ProfileField label="Email Address" value={participantDetails.email} />
                <ProfileField label="Address" value={participantDetails.address} />
            </div>
        </div>
    );
};
