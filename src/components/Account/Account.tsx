import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import './Account.css';

interface AccountProps {
    userEmail: string;
    userId: string;
    onClose: () => void;
}

export const Account: React.FC<AccountProps> = ({ userEmail, userId, onClose }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const db = getFirestore();
            // Get all organizations
            const orgsRef = collection(db, 'organizations');
            const orgsSnapshot = await getDocs(orgsRef);

            // Find the organization where this user exists
            for (const orgDoc of orgsSnapshot.docs) {
                const userRef = doc(db, 'organizations', orgDoc.id, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setFirstName(userData.firstName || '');
                    setLastName(userData.lastName || '');
                    break;
                }
            }
        };
        fetchUserData();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const db = getFirestore();
            // Find the organization first
            const orgsRef = collection(db, 'organizations');
            const orgsSnapshot = await getDocs(orgsRef);

            for (const orgDoc of orgsSnapshot.docs) {
                const userRef = doc(db, 'organizations', orgDoc.id, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    await updateDoc(userRef, {
                        firstName,
                        lastName,
                        updatedAt: new Date()
                    });
                    break;
                }
            }
            setMessage('Profile updated successfully!');
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setMessage('Error updating profile. Please try again.');
        }
        setIsLoading(false);
    };


    return (
        <div className="user-account-container">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit} className="user-account-form">
                <div className="user-account-form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="user-account-input"
                    />
                </div>

                <div className="user-account-form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="user-account-input"
                    />
                </div>

                <div className="user-account-form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={userEmail}
                        disabled
                        className="user-account-input user-account-input-disabled"
                    />
                </div>

                {message && <div className="user-account-message">{message}</div>}

                <div className="user-account-button-group">
                    <button
                        type="button"
                        onClick={onClose}
                        className="user-account-button user-account-button-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="user-account-button user-account-button-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};