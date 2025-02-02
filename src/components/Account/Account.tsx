import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
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
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setFirstName(userData.firstName || '');
                setLastName(userData.lastName || '');
            }
        };
        fetchUserData();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const db = getFirestore();
            await updateDoc(doc(db, 'users', userId), {
                firstName,
                lastName,
                updatedAt: new Date()
            });
            setMessage('Profile updated successfully!');
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setMessage('Error updating profile. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="account-container">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit} className="account-form">
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={userEmail}
                        disabled
                        className="form-input disabled"
                    />
                </div>

                {message && <div className="message">{message}</div>}

                <div className="button-group">
                    <button
                        type="button"
                        onClick={onClose}
                        className="button secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};