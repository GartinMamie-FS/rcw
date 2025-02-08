import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { RecapType, RecapField } from './types';
import { RecapTypeCard } from './RecapTypeCard';
import './ManageRecapTypes.css';

interface ManageRecapTypesProps {
    organizationId: string;
}

export const ManageRecapTypes: React.FC<ManageRecapTypesProps> = ({ organizationId }) => {
    const [recapTypes, setRecapTypes] = useState<RecapType[]>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);

    useEffect(() => {
        loadRecapTypes();
    }, [organizationId]);

    const loadRecapTypes = async () => {
        const db = getFirestore();
        const recapTypesRef = collection(db, 'organizations', organizationId, 'recapTypes');
        const snapshot = await getDocs(recapTypesRef);
        const types = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as RecapType));
        setRecapTypes(types);
    };

    return (
        <div className="manage-recap-types">
            <div className="header">
                <button onClick={() => setIsAddingNew(true)}>Add New Report Type</button>
            </div>

            {isAddingNew && (
                <RecapTypeForm
                    onSave={async (newType) => {
                        const db = getFirestore();
                        await addDoc(collection(db, 'organizations', organizationId, 'recapTypes'), newType);
                        setIsAddingNew(false);
                        loadRecapTypes();
                    }}
                    onCancel={() => setIsAddingNew(false)}
                />
            )}

            <div className="recap-types-list">
                {recapTypes.map(type => (
                    <RecapTypeCard
                        key={type.id}
                        recapType={type}
                        onUpdate={async (updated) => {
                            const db = getFirestore();
                            await updateDoc(doc(db, 'organizations', organizationId, 'recapTypes', type.id), updated);
                            loadRecapTypes();
                        }}
                        onDelete={async () => {
                            const db = getFirestore();
                            await deleteDoc(doc(db, 'organizations', organizationId, 'recapTypes', type.id));
                            loadRecapTypes();
                        }}
                    />
                ))}
            </div>
        </div>
    );
};


const RecapTypeForm: React.FC<{
    initialData?: RecapType;
    onSave: (data: Omit<RecapType, 'id'>) => void;
    onCancel: () => void;
}> = ({ initialData, onSave, onCancel }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [fields, setFields] = useState<RecapField[]>(initialData?.fields || []);

    const addField = () => {
        setFields([...fields, {
            id: Date.now().toString(),
            name: '',
            type: 'text',
            required: false
        }]);
    };

    return (
        <div className="recap-type-form">
            <div className="form-group">
                <label>Public Awareness/Impact Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="fields-section">
                <h3>Report Fields</h3>
                <h4 className="examples-header">Examples</h4>
                <div className="field-examples-container">
                    <div className="field-example-column">
                        <p className="example-title">Community Collaboration:</p>
                        <ul>
                            <li>Field 1: Date</li>
                            <li>Field 2: Details</li>
                            <li>Field 3: Number of Participants</li>
                        </ul>
                    </div>
                    <div className="field-example-column">
                        <p className="example-title">Narcan Distribution:</p>
                        <ul>
                            <li>Field 1: Date</li>
                            <li>Field 2: Location</li>
                            <li>Field 3: Number of Distributed</li>
                        </ul>
                    </div>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="field-item">
                        <input
                            type="text"
                            value={field.name}
                            onChange={(e) => {
                                const newFields = [...fields];
                                newFields[index].name = e.target.value;
                                setFields(newFields);
                            }}
                            placeholder="Field name"
                        />
                        <select
                            value={field.type}
                            onChange={(e) => {
                                const newFields = [...fields];
                                newFields[index].type = e.target.value as any;
                                setFields(newFields);
                            }}
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="multiSelect">Multi Select</option>
                        </select>
                        <label>
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => {
                                    const newFields = [...fields];
                                    newFields[index].required = e.target.checked;
                                    setFields(newFields);
                                }}
                            />
                            Required
                        </label>
                        <button onClick={() => {
                            setFields(fields.filter((_, i) => i !== index));
                        }}>Remove
                        </button>
                    </div>
                ))}
                <button onClick={addField}>Add Field</button>
            </div>

            <div className="button-container">
                <button onClick={() => onSave({name, fields})}>Save</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
};