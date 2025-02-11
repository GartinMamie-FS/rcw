import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { differenceInYears } from 'date-fns';


interface DemographicsFormProps {
    participantId: string;
    dateOfBirth: string;
    onComplete: () => void;
    organizationId: string;
}

// Define options for dropdowns
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

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
                                                                      participantId,
                                                                      dateOfBirth,
                                                                      onComplete,
                                                                      organizationId
                                                                  }) => {
    const [age, setAge] = useState<number | null>(null);
    const [gender, setGender] = useState('');
    const [race, setRace] = useState('');
    const [sexualOrientation, setSexualOrientation] = useState('');

    useEffect(() => {
        if (dateOfBirth) {
            const birthDate = new Date(dateOfBirth);
            const calculatedAge = differenceInYears(new Date(), birthDate);
            setAge(calculatedAge);
        }
    }, [dateOfBirth]);

    const saveDemographics = async () => {
        const db = getFirestore();

        const demographicsData = {
            age,
            gender,
            race,
            sexualOrientation,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(
            doc(db, 'organizations', organizationId, 'participants', participantId, 'demographics', 'current'),
            demographicsData
        );

        onComplete();
    };

    return (
        <div className="demographics-form">
            <h2>Demographics Information</h2>
            <p className="required-text">* indicates required field</p>

            <div className="form-section">
                <div className="form-group">
                    <label>Age</label>
                    <input
                        type="number"
                        value={age || ''}
                        readOnly
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Gender *</label>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="form-input"
                        required
                    >
                        <option value="">Select Gender</option>
                        {GENDER_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Race/Ethnicity *</label>
                    <select
                        value={race}
                        onChange={(e) => setRace(e.target.value)}
                        className="form-input"
                        required
                    >
                        <option value="">Select Race/Ethnicity</option>
                        {RACE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Sexual Orientation *</label>
                    <select
                        value={sexualOrientation}
                        onChange={(e) => setSexualOrientation(e.target.value)}
                        className="form-input"
                        required
                    >
                        <option value="">Select Sexual Orientation</option>
                        {ORIENTATION_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                className="save-button"
                disabled={!gender || !race || !sexualOrientation}
                onClick={saveDemographics}
            >
                Save
            </button>
        </div>
    );
};
