import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import './ViewStaffScreen.css';
import { EditStaffScreen } from './EditStaffScreen';

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    organizationId: string;
}

export const ViewStaffScreen: React.FC = () => {
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const { organizationId } = useOrganization();
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
            await deleteDoc(doc(db, 'users', staffId));
            fetchStaffMembers();
        }
    };

    return (
        <div className="view-staff-screen">
            <h2>Staff Members</h2>
            <table className="staff-table">
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
                                className="view-button"
                                onClick={() => setSelectedStaffId(staff.id)}
                            >
                                View
                            </button>
                            <button
                                className="delete-button"
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
