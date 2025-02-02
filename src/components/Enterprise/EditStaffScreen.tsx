import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';
import { useOrganization } from '../../context/OrganizationContext';
import './EditStaffScreen.css';

interface EditStaffScreenProps {
    staffId: string;
    onClose: () => void;
}

interface StaffMember {
    firstName: string;
    lastName: string;
    email: string;
    uid: string;
}

export const EditStaffScreen: React.FC<EditStaffScreenProps> = ({ staffId, onClose }) => {
    const { organizationId } = useOrganization();
    const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const db = getFirestore();
    const auth = getAuth();

    useEffect(() => {
        const fetchStaffMember = async () => {
            if (!organizationId || !staffId) return;

            const staffDoc = await getDoc(doc(db, 'organizations', organizationId, 'users', staffId));
            if (staffDoc.exists()) {
                const data = staffDoc.data() as StaffMember;
                setStaffMember(data);
                setFirstName(data.firstName);
                setLastName(data.lastName);
                setEmail(data.email);
            }
        };

        fetchStaffMember();
    }, [organizationId, staffId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const updates: Partial<StaffMember> = {
                firstName,
                lastName,
                email
            };

            // Update Firestore document
            await updateDoc(doc(db, 'organizations', organizationId, 'users', staffId), updates);

            // Update email in Firebase Auth if changed
            if (email !== staffMember?.email && staffMember?.uid) {
                await updateEmail(auth.currentUser!, email);
            }

            // Update password if provided
            if (newPassword && staffMember?.uid) {
                await updatePassword(auth.currentUser!, newPassword);
            }

            setMessage('Staff member updated successfully');
        } catch (error: any) {
            setMessage('Error updating staff member: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="edit-staff-screen">
            <div className="edit-staff-container">
                <h2>Edit Staff Member</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password (leave blank to keep current)</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                    </div>

                    {message && <div className="message">{message}</div>}

                    <div className="button-group">
                        <button
                            type="submit"
                            className="save-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};