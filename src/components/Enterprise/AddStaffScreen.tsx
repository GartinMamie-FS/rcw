import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

interface Organization {
    id: string;
    name: string;
}

export const AddStaffScreen: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [staffRole, setStaffRole] = useState('staff');

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        const querySnapshot = await getDocs(collection(db, 'organizations'));
        const orgs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        setOrganizations(orgs);
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Check if user already exists
            const userQuery = query(
                collection(db, 'users'),
                where('email', '==', staffEmail)
            );
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                alert('User already exists!');
                return;
            }

            // Add new staff member
            await addDoc(collection(db, 'users'), {
                email: staffEmail,
                organizationId: selectedOrg,
                role: staffRole,
                createdAt: new Date()
            });

            // Reset form
            setStaffEmail('');
            setSelectedOrg('');
            setStaffRole('staff');
            alert('Staff member added successfully!');
        } catch (error) {
            console.error('Error adding staff:', error);
            alert('Error adding staff member');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Add Staff Member</h2>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <div>
                        <label className="block mb-2">Organization:</label>
                        <select
                            value={selectedOrg}
                            onChange={(e) => setSelectedOrg(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="">Select Organization</option>
                            {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2">Staff Email:</label>
                        <input
                            type="email"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Role:</label>
                        <select
                            value={staffRole}
                            onChange={(e) => setStaffRole(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Staff Member
                    </button>
                </form>
            </div>
        </div>
    );
};
