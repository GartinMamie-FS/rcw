import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs, deleteDoc, doc, setDoc, increment } from 'firebase/firestore';
import './ViewStaffScreen.css';
import { EditStaffScreen } from './EditStaffScreen';

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    organizationId: string;
}

interface ViewStaffScreenProps {
    organizationId: string;
}

export const ViewStaffScreen: React.FC<ViewStaffScreenProps> = ({ organizationId }) => {
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const db = getFirestore();

    useEffect(() => {
        fetchStaffMembers();
    }, [organizationId]);

    const fetchStaffMembers = async () => {
        if (!organizationId) return;

        const staffQuery = query(
            collection(db, 'organizations', organizationId, 'users')
        );
        const querySnapshot = await getDocs(staffQuery);
        const staff = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StaffMember[];
        setStaffMembers(staff);
    };

    const handleDelete = async (staffId: string) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            await deleteDoc(doc(db, 'organizations', organizationId, 'users', staffId));

            // Update the organization's user count
            await setDoc(doc(db, 'organizations', organizationId), {
                currentUsers: increment(-1)
            }, { merge: true });

            fetchStaffMembers();
        }
    };


    return (
        <div className="view-staff-container">
            <h2>Staff Members</h2>
            <table className="view-staff-members-table">
                <thead>
                <tr>
                    <th>Staff Member</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {staffMembers.map((staff) => (
                    <tr key={staff.id}>
                        <td>{staff.firstName} {staff.lastName}</td>
                        <td>
                            <button
                                className="view-staff-action-button"
                                onClick={() => setSelectedStaffId(staff.id)}
                            >
                                View
                            </button>
                            <button
                                className="view-staff-delete-button"
                                onClick={() => handleDelete(staff.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedStaffId && (
                <EditStaffScreen
                    staffId={selectedStaffId}
                    onClose={() => setSelectedStaffId(null)}
                />
            )}
        </div>
    );
};
