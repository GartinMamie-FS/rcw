import React, { useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
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
    const [currentAdminPassword, setCurrentAdminPassword] = useState('');

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const currentUser = auth.currentUser;

            const userQuery = query(
                collection(db, 'organizations', organizationId, 'users'),
                where('email', '==', staffEmail)
            );
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                alert('User already exists!');
                return;
            }

            await signOut(auth);

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                staffEmail,
                staffPassword
            );

            await setDoc(doc(db, 'organizations', organizationId, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: staffEmail,
                firstName,
                lastName,
                role: staffRole,
                createdAt: new Date()
            });

            await signOut(auth);

            if (currentUser) {
                await signInWithEmailAndPassword(auth, currentUser.email!, currentAdminPassword);
            }

            setStaffEmail('');
            setStaffPassword('');
            setStaffRole('staff');
            setFirstName('');
            setLastName('');
            setCurrentAdminPassword('');
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
                        <label>Your Password (Required to maintain session) *</label>
                        <input
                            type="password"
                            value={currentAdminPassword}
                            onChange={(e) => setCurrentAdminPassword(e.target.value)}
                            className="add-staff-input"
                            required
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
                        disabled={!staffEmail || !staffPassword || !firstName || !lastName || !currentAdminPassword}
                    >
                        Add Staff Member
                    </button>
                </form>
            </div>
        </div>
    );
};
