import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, Timestamp, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '../../config/firebase';
import './OrganizationManagement.css';


interface Organization {
    id: string;
    name: string;
    email: string;
    createdAt: Timestamp;
    subscriptionTier: number;
    subscriptionEndDate: Timestamp;
    currentUsers: number;
    maxUsers: number;
}

export const OrganizationManagementScreen: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgEmail, setNewOrgEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [loading, setLoading] = useState(true);
    const [subscriptionTier, setSubscriptionTier] = useState(1);
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

    const handleUpdateSubscription = async (orgId: string, newTier: number) => {
        try {
            const maxUsers = newTier === 1 ? 5 : newTier === 2 ? 15 : 999;
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            await setDoc(doc(db, 'organizations', orgId), {
                subscriptionTier: newTier,
                subscriptionEndDate: Timestamp.fromDate(endDate),
                maxUsers: maxUsers
            }, { merge: true });

            fetchOrganizations();
        } catch (error) {
            console.error('Error updating subscription:', error);
        }
    };

    const handleAddOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const maxUsers = subscriptionTier === 1 ? 5 : subscriptionTier === 2 ? 15 : 999;
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            const newOrg = {
                name: newOrgName,
                email: newOrgEmail,
                createdAt: Timestamp.now(),
                subscriptionTier: subscriptionTier,
                subscriptionEndDate: Timestamp.fromDate(endDate),
                currentUsers: 1,
                maxUsers: maxUsers
            };

            const orgDoc = await addDoc(collection(db, 'organizations'), newOrg);

            // Create secondary app for new user creation
            const secondaryApp = initializeApp(firebaseConfig, 'secondary');
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                newOrgEmail,
                adminPassword
            );

            await setDoc(doc(db, 'organizations', orgDoc.id, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: newOrgEmail,
                firstName: adminFirstName,
                lastName: adminLastName,
                role: 'admin',
                createdAt: Timestamp.now()
            });

            // Clean up secondary app
            await deleteApp(secondaryApp);

            // Reset form
            setNewOrgName('');
            setNewOrgEmail('');
            setAdminPassword('');
            setAdminFirstName('');
            setAdminLastName('');
            setSubscriptionTier(1);
            fetchOrganizations();

        } catch (error) {
            console.error('Error adding organization:', error);
        }
    };

    return (
        <div className="organization-management">
            <div className="organization-form">
                <h2>Add New Organization</h2>
                <p className="required-text">* indicates required field</p>

                <form onSubmit={handleAddOrganization}>
                    <div className="form-group">
                        <label>Organization Name *</label>
                        <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Admin Email *</label>
                        <input
                            type="email"
                            value={newOrgEmail}
                            onChange={(e) => setNewOrgEmail(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Admin Password *</label>
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Admin First Name *</label>
                        <input
                            type="text"
                            value={adminFirstName}
                            onChange={(e) => setAdminFirstName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Admin Last Name *</label>
                        <input
                            type="text"
                            value={adminLastName}
                            onChange={(e) => setAdminLastName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Subscription Tier *</label>
                        <select
                            value={subscriptionTier}
                            onChange={(e) => setSubscriptionTier(Number(e.target.value))}
                            className="form-input"
                            required
                        >
                            <option value={1}>Tier 1 (5 users)</option>
                            <option value={2}>Tier 2 (15 users)</option>
                            <option value={3}>Tier 3 (Unlimited)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={!newOrgName || !newOrgEmail || !adminPassword || !adminFirstName || !adminLastName}
                    >
                        Add Organization
                    </button>
                </form>
            </div>

            <div className="organizations-list">
                <h2>Organizations</h2>
                {loading ? (
                    <p>Loading organizations...</p>
                ) : (
                    <div className="organizations-grid">
                        {organizations.map((org) => (
                            <div key={org.id} className="organization-card">
                                <h3>{org.name}</h3>
                                <p>{org.email}</p>
                                <p>Subscription Tier: {org.subscriptionTier}</p>
                                <p>Users: {org.currentUsers}/{org.maxUsers}</p>
                                <p>Subscription Ends: {org.subscriptionEndDate?.toDate().toLocaleDateString()}</p>
                                <select
                                    onChange={(e) => handleUpdateSubscription(org.id, Number(e.target.value))}
                                    value={org.subscriptionTier}
                                    className="tier-select"
                                >
                                    <option value={1}>Tier 1 (5 users)</option>
                                    <option value={2}>Tier 2 (15 users)</option>
                                    <option value={3}>Tier 3 (Unlimited)</option>
                                </select>
                                <p className="created-date">
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
