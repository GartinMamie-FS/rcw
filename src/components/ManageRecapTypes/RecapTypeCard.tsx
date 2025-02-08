import React, { useState } from 'react';
import { RecapType } from './types';
import { RecapTypeForm } from './RecapTypeForm';

interface RecapTypeCardProps {
    recapType: RecapType;
    onUpdate: (updated: Partial<RecapType>) => void;
    onDelete: () => void;
}

export const RecapTypeCard: React.FC<RecapTypeCardProps> = ({ recapType, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <RecapTypeForm
                initialData={recapType}
                onSave={(updated: Partial<RecapType>) => {
                    onUpdate(updated);
                    setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    return (
        <div className="recap-type-card">
            <div className="card-header">
                <h3 style={{ width: '100%', textAlign: 'center' }}>{recapType.name}</h3>
            </div>
            <div className="card-actions" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => setIsEditing(true)}>Edit</button>
                <button onClick={onDelete} className="delete-button">Delete</button>
            </div>
            <div className="fields-list">
                {recapType.fields.map((field) => (
                    <div key={field.id} className="field-item">
                        <span className="field-name">{field.name}</span>
                        <span className="field-type">{field.type}</span>
                        {field.required && <span className="required-badge">Required</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};
