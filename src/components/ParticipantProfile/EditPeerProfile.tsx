import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import './EditPeerProfile.css'


interface EditPeerProfileProps {
    participantId: string;
    onSaveComplete: () => void;
}

const GENDER_OPTIONS = [
    'Male',
    'Female',
    'Transgender Male',
    'Transgender Female',
    'Non-binary',
    'Other',
    'Prefer not to say'
];

const RACE_OPTIONS = [
    'American Indian or Alaska Native',
    'Asian',
    'Black or African American',
    'Hispanic or Latino',
    'Native Hawaiian or Other Pacific Islander',
    'White',
    'Two or More Races',
    'Other',
    'Prefer not to say'
];

const ORIENTATION_OPTIONS = [
    'Heterosexual',
    'Gay',
    'Lesbian',
    'Bisexual',
    'Pansexual',
    'Asexual',
    'Other',
    'Prefer not to say'
];

export const EditPeerProfile: React.FC<EditPeerProfileProps> = ({ participantId, onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [gender, setGender] = useState('');
    const [race, setRace] = useState('');
    const [sexualOrientation, setSexualOrientation] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (participantId && organizationId) {
                const db = getFirestore();

                // Fetch profile info from the 'details' document
                const profileDoc = await getDoc(doc(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation', 'details'));

                if (profileDoc.exists()) {
                    const data = profileDoc.data();
                    setFirstName(data.firstName || '');
                    setLastName(data.lastName || '');
                    setDateOfBirth(data.dateOfBirth || '');
                    setPhone(data.phone || '');
                    setEmail(data.email || '');
                    setAddress(data.address || '');
                }

                // Fetch demographics
                const demographicsDoc = await getDoc(doc(db, 'organizations', organizationId, 'participants', participantId, 'demographics', 'current'));

                if (demographicsDoc.exists()) {
                    const demoData = demographicsDoc.data();
                    setGender(demoData.gender || '');
                    setRace(demoData.race || '');
                    setSexualOrientation(demoData.sexualOrientation || '');
                }
            }
        };

        fetchData();
    }, [participantId, organizationId]);


    const handleSave = async () => {
        if (!organizationId) return;

        const db = getFirestore();

        try {
            // Save profile data to the 'details' document
            const profileRef = doc(db, 'organizations', organizationId, 'participants', participantId, 'participantInformation', 'details');

            const profileData = {
                firstName,
                lastName,
                dateOfBirth,
                phone,
                email,
                address,
                updatedAt: new Date(),
                createdAt: new Date() // Add this if it doesn't exist
            };

            await setDoc(profileRef, profileData, { merge: true });

            // Save demographics data
            const demographicsRef = doc(db, 'organizations', organizationId, 'participants', participantId, 'demographics', 'current');
            const demographicsData = {
                gender,
                race,
                sexualOrientation,
                updatedAt: new Date()
            };

            await setDoc(demographicsRef, demographicsData, { merge: true });

            onSaveComplete();
        } catch (error) {
            console.error('Error saving data:', error);
        }
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

            <h3>Demographics Information</h3>

            <div className="form-group">
                <label>Gender</label>
                <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Race/Ethnicity</label>
                <select
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                >
                    <option value="">Select Race/Ethnicity</option>
                    {RACE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Sexual Orientation</label>
                <select
                    value={sexualOrientation}
                    onChange={(e) => setSexualOrientation(e.target.value)}
                    className="form-input"
                    disabled={!organizationId}
                >
                    <option value="">Select Sexual Orientation</option>
                    {ORIENTATION_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
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
