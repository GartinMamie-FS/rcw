import React, { useState } from 'react';
import { RecapType, RecapField } from './types';

interface RecapTypeFormProps {
    initialData?: RecapType;
    onSave: (data: Omit<RecapType, 'id'>) => void;
    onCancel: () => void;
}

export const RecapTypeForm: React.FC<RecapTypeFormProps> = ({ initialData, onSave, onCancel }) => {
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
                                newFields[index].type = e.target.value as RecapField['type'];
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
                        }}>Remove</button>
                    </div>
                ))}
                <button onClick={addField}>Add Field</button>
            </div>

            <div className="button-container">
                <button onClick={() => onSave({ name, fields })}>Save</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
};
