import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';
import './CreateOrganizationRecap.css';

interface RecapType {
    id: string;
    name: string;
    fields: {
        id: string;
        name: string;
        type: 'text' | 'number' | 'date' | 'multiSelect';
        required: boolean;
        options?: string[];
    }[];
}

interface Recap {
    name: string;
    organizationId: string;
    recapTypeId: string;
    recapTypeName: string;
    fields: { [key: string]: any };
    date: string;
}

interface RecapWithId {
    id: string;
    recap: Recap;
    date: string;
}
interface CreateOrganizationRecapScreenProps {
    organizationId: string;
    onBack: () => void;
}

export const CreateOrganizationRecapScreen: React.FC<CreateOrganizationRecapScreenProps> = ({ onBack }) => {
    const { organizationId } = useOrganization();
    const [recapName, setRecapName] = useState('');
    const [selectedRecapType, setSelectedRecapType] = useState<RecapType | null>(null);
    const [recapTypes, setRecapTypes] = useState<RecapType[]>([]);
    const [formData, setFormData] = useState<{[key: string]: any}>({});
    const [recaps, setRecaps] = useState<RecapWithId[]>([]);
    const [selectedRecap, setSelectedRecap] = useState<RecapWithId | null>(null);

    useEffect(() => {
        const loadRecapTypes = async () => {
            if (!organizationId) return;
            const db = getFirestore();
            const recapTypesRef = collection(db, 'organizations', organizationId, 'recapTypes');
            const snapshot = await getDocs(recapTypesRef);
            const types = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as RecapType));
            setRecapTypes(types);
        };

        loadRecapTypes();
    }, [organizationId]);

    useEffect(() => {
        const loadRecaps = async () => {
            if (!organizationId) return;
            const db = getFirestore();
            const recapsRef = collection(db, 'organizations', organizationId, 'recaps');
            const snapshot = await getDocs(recapsRef);
            const recapsList = snapshot.docs.map(doc => ({
                id: doc.id,
                recap: doc.data() as Recap,
                date: doc.data().date || ''
            }));
            setRecaps(recapsList);
        };

        loadRecaps();
    }, [organizationId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationId || !selectedRecapType) return;

        const db = getFirestore();
        const currentDate = new Date().toLocaleDateString();

        await addDoc(collection(db, 'organizations', organizationId, 'recaps'), {
            name: recapName,
            date: currentDate,
            createdAt: new Date(),
            recapTypeId: selectedRecapType.id,
            recapTypeName: selectedRecapType.name,
            fields: formData
        });

        // Refresh the recaps list
        const recapsRef = collection(db, 'organizations', organizationId, 'recaps');
        const snapshot = await getDocs(recapsRef);
        const recapsList = snapshot.docs.map(doc => ({
            id: doc.id,
            recap: doc.data() as Recap,
            date: doc.data().date || ''
        }));
        setRecaps(recapsList);

        // Reset form
        setRecapName('');
        setSelectedRecapType(null);
        setFormData({});
    };

    const handleViewDetails = (recap: RecapWithId) => {
        setSelectedRecap(recap);
    };

    const renderFormFields = () => {
        if (!selectedRecapType) return null;

        return selectedRecapType.fields.map(field => (
            <div key={field.id} className="form-group">
                <label>{field.name}</label>
                {field.type === 'text' && (
                    <input
                        type="text"
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            [field.id]: e.target.value
                        })}
                        required={field.required}
                        className="form-input"
                    />
                )}
                {field.type === 'number' && (
                    <input
                        type="number"
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            [field.id]: e.target.value
                        })}
                        required={field.required}
                        className="form-input"
                    />
                )}
                {field.type === 'date' && (
                    <input
                        type="date"
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            [field.id]: e.target.value
                        })}
                        required={field.required}
                        className="form-input"
                    />
                )}
                {field.type === 'multiSelect' && field.options && (
                    <select
                        multiple
                        value={formData[field.id] || []}
                        onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setFormData({
                                ...formData,
                                [field.id]: values
                            });
                        }}
                        required={field.required}
                        className="form-input"
                    >
                        {field.options.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        ));
    };

    return (
        <div className="org-recap-screen">
            <div className="org-recap-header">
                <button className="org-recap-back-button" onClick={onBack}>Back</button>
                <h2>Report Public Awareness/Impact</h2>
            </div>

            <div className="org-recap-form-container">
                <form onSubmit={handleSubmit}>
                    <div className="org-recap-form-group">
                        <label>Public Awareness/Impact</label>
                        <select
                            value={selectedRecapType?.id || ''}
                            onChange={(e) => {
                                const selected = recapTypes.find(type => type.id === e.target.value);
                                setSelectedRecapType(selected || null);
                                setFormData({});
                            }}
                            className="org-recap-input"
                            required
                        >
                            <option value="">Select a recap type</option>
                            {recapTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedRecapType && (
                        <div className="org-recap-form-group">
                            <label>Activity Name</label>
                            <input
                                type="text"
                                value={recapName}
                                onChange={(e) => setRecapName(e.target.value)}
                                placeholder="Enter activity name"
                                className="org-recap-input"
                                required
                            />
                        </div>
                    )}

                    {renderFormFields()}

                    <div className="org-recap-button-container">
                        <button
                            type="submit"
                            className="org-recap-submit-button"
                            disabled={!recapName.trim() || !organizationId || !selectedRecapType}
                        >
                            Create Recap
                        </button>
                    </div>
                </form>
            </div>

            <div className="org-recap-list">
                <h3>Recent Organization Recaps</h3>
                <table className="org-recap-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {recaps.map(recap => (
                        <tr key={recap.id}>
                            <td>{recap.date}</td>
                            <td>{recap.recap.name}</td>
                            <td>{recap.recap.recapTypeName}</td>
                            <td>
                                <button
                                    className="org-recap-view-button"
                                    onClick={() => handleViewDetails(recap)}
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {selectedRecap && (
                <div className="org-recap-modal" onClick={() => setSelectedRecap(null)}>
                    <div className="org-recap-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="org-recap-modal-header">
                            <h2>{selectedRecap.recap.name}</h2>
                            <button
                                className="org-recap-close-button"
                                onClick={() => setSelectedRecap(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="org-recap-modal-body">
                            <p><strong>Date:</strong> {selectedRecap.date}</p>
                            <p><strong>Type:</strong> {selectedRecap.recap.recapTypeName}</p>
                            <h3>Fields:</h3>
                            {Object.entries(selectedRecap.recap.fields).map(([key, value]) => (
                                <div key={key} className="org-recap-field-item">
                                    <strong>{key}:</strong> {String(value)}
                                </div>
                            ))}
                        </div>
                        <div className="org-recap-modal-footer">
                            <button
                                className="org-recap-dismiss-button"
                                onClick={() => setSelectedRecap(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
