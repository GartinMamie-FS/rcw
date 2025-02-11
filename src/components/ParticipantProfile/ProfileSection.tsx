import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import './ProfileSection.css'
import { format } from 'date-fns';

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

interface TabProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
    <button
        className={`tab-button ${isActive ? 'active' : ''}`}
        onClick={onClick}
    >
        {label}
    </button>
);

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
    const [activeTab, setActiveTab] = useState('profile');
    const [participantDetails, setParticipantDetails] = useState<ParticipantDetails>({
        name: '',
        dob: '',
        phone: '',
        email: '',
        address: ''
    });
    const [demographics, setDemographics] = useState({
        age: '',
        gender: '',
        race: '',
        sexualOrientation: ''
    });

    useEffect(() => {
        // Update the profile data fetch section in the useEffect
        const fetchData = async () => {
            if (!organizationId || !participantId) return;

            const db = getFirestore();

            // Fetch profile data from the 'details' document
            const profileRef = doc(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation', 'details');
            const profileDoc = await getDoc(profileRef);

            if (profileDoc.exists()) {
                const data = profileDoc.data();
                const formattedDate = data.dateOfBirth ? format(new Date(data.dateOfBirth), 'MM/dd/yyyy') : '';
                setParticipantDetails({
                    name: `${data.firstName} ${data.lastName}`,
                    dob: formattedDate,
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || ''
                });
            }

            // Fetch demographics data
            const demographicsRef = doc(db, 'organizations', organizationId, 'participants', participantId, 'demographics', 'current');
            const demographicsDoc = await getDoc(demographicsRef);

            if (demographicsDoc.exists()) {
                const demoData = demographicsDoc.data();
                setDemographics({
                    age: demoData.age || '',
                    gender: demoData.gender || '',
                    race: demoData.race || '',
                    sexualOrientation: demoData.sexualOrientation || ''
                });
            }
        };
        fetchData();
    }, [participantId, organizationId]);


    return (
        <div className="profile-section">
            <div className="header-row">
                <div className="tabs">
                    <Tab
                        label="Peer Profile"
                        isActive={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                    />
                    <Tab
                        label="Demographics"
                        isActive={activeTab === 'demographics'}
                        onClick={() => setActiveTab('demographics')}
                    />
                </div>
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

            {activeTab === 'profile' ? (
                <div className="profile-fields">
                    <ProfileField label="Name" value={participantDetails.name} />
                    <ProfileField label="DOB" value={participantDetails.dob} />
                    <ProfileField label="Phone Number" value={participantDetails.phone} />
                    <ProfileField label="Email Address" value={participantDetails.email} />
                    <ProfileField label="Address" value={participantDetails.address} />
                </div>
            ) : (
                <div className="demographics-fields">
                    <ProfileField label="Age" value={demographics.age.toString()} />
                    <ProfileField label="Gender" value={demographics.gender} />
                    <ProfileField label="Race/Ethnicity" value={demographics.race} />
                    <ProfileField label="Sexual Orientation" value={demographics.sexualOrientation} />
                </div>
            )}
        </div>
    );
};
