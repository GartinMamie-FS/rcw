import React, { useState, useEffect } from 'react';
import { getFirestore } from 'firebase/firestore';
import { collection, getDocs, query, where, doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import './AddStaffScreen.css';


interface AddStaffScreenProps {
    organizationId: string;
}

export const AddStaffScreen: React.FC<AddStaffScreenProps> = ({ organizationId }) => {
    const db = getFirestore();
    const [staffEmail, setStaffEmail] = useState('');
    const [staffPassword, setStaffPassword] = useState('');
    const [staffRole, setStaffRole] = useState('staff');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [userCount, setUserCount] = useState(0);
    const [maxUsers, setMaxUsers] = useState(0);

    // Add this useEffect to fetch organization details
    useEffect(() => {
        const fetchOrgDetails = async () => {
            const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
            if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                setMaxUsers(orgData.maxUsers);
                setUserCount(orgData.currentUsers);
            }
        };
        fetchOrgDetails();
    }, [organizationId, db]);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (userCount >= maxUsers) {
                alert('User limit reached for your subscription tier. Please upgrade to add more users.');
                return;
            }

            const userQuery = query(
                collection(db, 'organizations', organizationId, 'users'),
                where('email', '==', staffEmail)
            );
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                alert('User already exists!');
                return;
            }

            // Initialize a secondary Firebase app
            const secondaryApp = initializeApp({
                // Copy your firebase config from config/firebase.ts
                apiKey: "AIzaSyBHDKop-D6gvQG4z4ZF_tfDxBpA7xgS27s",
                authDomain: "recovery-connect-web.firebaseapp.com",
                projectId: "recovery-connect-web",
                storageBucket: "recovery-connect-web.firebasestorage.app",
                messagingSenderId: "236368090937",
                appId: "1:236368090937:web:4b51ca50282c136b323ae8",
                measurementId: "G-3C7NGJK7V9"
            }, 'Secondary');

            const secondaryAuth = getAuth(secondaryApp);

            // Create new user with secondary auth instance
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                staffEmail,
                staffPassword
            );

            // Create the user document
            await setDoc(doc(db, 'organizations', organizationId, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: staffEmail,
                firstName,
                lastName,
                role: staffRole,
                createdAt: new Date()
            });

            // Update organization's user count
            await setDoc(doc(db, 'organizations', organizationId), {
                currentUsers: increment(1)
            }, { merge: true });

            // Clean up secondary app
            await deleteApp(secondaryApp);


            // Reset form
            setUserCount(prev => prev + 1);
            setStaffEmail('');
            setStaffPassword('');
            setStaffRole('staff');
            setFirstName('');
            setLastName('');
            alert('Staff member added successfully!');

        } catch (error) {
            console.error('Detailed error:', error);
            alert('Error adding staff member. Check console for details.');
        }
    };


    return (
        <div className="add-staff-container">
            <div className="add-staff-form-wrapper">
                <h2>Add Staff Member</h2>
                <p className="add-staff-required-text">* indicates required field</p>

                <div className="user-count-info">
                    <p>Current Users: {userCount} / {maxUsers}</p>
                    {userCount >= maxUsers && (
                        <p className="limit-warning">
                            User limit reached. Please upgrade your subscription to add more users.
                        </p>
                    )}
                </div>
                <form onSubmit={handleAddStaff}>
                    <div className="add-staff-form-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="add-staff-input"
                            required
                        />
                    </div>

                    <div className="add-staff-form-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="add-staff-input"
                            required
                        />
                    </div>

                    <div className="add-staff-form-group">
                        <label>Staff Email *</label>
                        <input
                            type="email"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            className="add-staff-input"
                            required
                        />
                    </div>

                    <div className="add-staff-form-group">
                        <label>Staff Password *</label>
                        <input
                            type="password"
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            className="add-staff-input"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="add-staff-form-group">
                        <label>Role *</label>
                        <select
                            value={staffRole}
                            onChange={(e) => setStaffRole(e.target.value)}
                            className="add-staff-input"
                            required
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="add-staff-submit-button"
                        disabled={!staffEmail || !staffPassword || !firstName || !lastName}
                    >
                        Add Staff Member
                    </button>
                </form>
            </div>
        </div>
    );
};
