import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, Timestamp, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import './OrganizationManagement.css';

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
    const [adminPassword, setAdminPassword] = useState('');
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [loading, setLoading] = useState(true);
    const [developerPassword, setDeveloperPassword] = useState('');
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
            const currentUser = auth.currentUser;

            const newOrg = {
                name: newOrgName,
                email: newOrgEmail,
                createdAt: Timestamp.now()
            };

            const orgDoc = await addDoc(collection(db, 'organizations'), newOrg);

            await signOut(auth);

            const userCredential = await createUserWithEmailAndPassword(
                auth,
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

            await signOut(auth);

            if (currentUser) {
                await signInWithEmailAndPassword(
                    auth,
                    currentUser.email!,
                    developerPassword
                );
            }

            setNewOrgName('');
            setNewOrgEmail('');
            setAdminPassword('');
            setAdminFirstName('');
            setAdminLastName('');
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
                        <label>Developer Password *</label>
                        <input
                            type="password"
                            value={developerPassword}
                            onChange={(e) => setDeveloperPassword(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={!newOrgName || !newOrgEmail || !adminPassword || !adminFirstName || !adminLastName || !developerPassword}
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
