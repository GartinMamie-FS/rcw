import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import './AddServiceForm.css';

interface AddServiceFormProps {
    onSaveComplete: () => void;
}

export const AddServiceForm: React.FC<AddServiceFormProps> = ({ onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [serviceName, setServiceName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const db = getFirestore();
        await addDoc(collection(db, 'organizations', organizationId, 'services'), {
            name: serviceName,
            createdAt: new Date()
        });
        onSaveComplete();
    };

    return (
        <div className="service-form-screen">
            <h2>Create New Service</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Service Name</label>
                    <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="Enter service name"
                        className="form-input"
                    />
                </div>

                <div className="button-container">
                    <button
                        type="submit"
                        className="form-button"
                        disabled={!serviceName.trim() || !organizationId}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onSaveComplete}
                        className="form-button"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
