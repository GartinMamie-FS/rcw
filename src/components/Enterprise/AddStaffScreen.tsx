import React, { useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import './AddStaffScreen.css';
import { useOrganization } from '../../context/OrganizationContext';

export const AddStaffScreen: React.FC = () => {
    const db = getFirestore();
    const { organizationId } = useOrganization();
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
        <div className="add-staff-screen">
            <div className="staff-form">
                <h2>Add Staff Member</h2>
                <p className="required-text">* indicates required field</p>

                <form onSubmit={handleAddStaff}>
                    <div className="form-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Staff Email *</label>
                        <input
                            type="email"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Staff Password *</label>
                        <input
                            type="password"
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            className="form-input"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label>Your Password (Required to maintain session) *</label>
                        <input
                            type="password"
                            value={currentAdminPassword}
                            onChange={(e) => setCurrentAdminPassword(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Role *</label>
                        <select
                            value={staffRole}
                            onChange={(e) => setStaffRole(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={!staffEmail || !staffPassword || !firstName || !lastName || !currentAdminPassword}
                    >
                        Add Staff Member
                    </button>
                </form>
            </div>
        </div>
    );
};
