import React, { useState, useEffect } from 'react';
import { getFirestore } from 'firebase/firestore';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

interface Organization {
    id: string;
    name: string;
    email: string;
    createdAt: Timestamp;
}

export const OrganizationManagementScreen: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgEmail, setNewOrgEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const db = getFirestore();

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'organizations'));
            const orgs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Organization));
            setOrganizations(orgs);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching organizations:', error);
            setLoading(false);
        }
    };

    const handleAddOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newOrg = {
                name: newOrgName,
                email: newOrgEmail,
                createdAt: Timestamp.now()
            };

            await addDoc(collection(db, 'organizations'), newOrg);
            setNewOrgName('');
            setNewOrgEmail('');
            fetchOrganizations();
        } catch (error) {
            console.error('Error adding organization:', error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Organization Management</h2>

            {/* Add Organization Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">Add New Organization</h3>
                <form onSubmit={handleAddOrganization} className="space-y-4">
                    <div>
                        <label className="block mb-2">Organization Name:</label>
                        <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Admin Email:</label>
                        <input
                            type="email"
                            value={newOrgEmail}
                            onChange={(e) => setNewOrgEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Organization
                    </button>
                </form>
            </div>

            {/* Organizations List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Organizations</h3>
                {loading ? (
                    <p>Loading organizations...</p>
                ) : (
                    <div className="space-y-4">
                        {organizations.map((org) => (
                            <div
                                key={org.id}
                                className="border p-4 rounded-lg hover:bg-gray-50"
                            >
                                <h4 className="font-semibold">{org.name}</h4>
                                <p className="text-gray-600">{org.email}</p>
                                <p className="text-sm text-gray-500">
                                    Created: {org.createdAt.toDate().toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
