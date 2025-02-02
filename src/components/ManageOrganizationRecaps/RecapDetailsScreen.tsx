import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useOrganization } from '../../context/OrganizationContext';

interface RecapDetailsScreenProps {
    recapId: string;
    onBack: () => void;
}

export const RecapDetailsScreen: React.FC<RecapDetailsScreenProps> = ({ recapId, onBack }) => {
    const { organizationId } = useOrganization();
    const [recap, setRecap] = useState<any>(null);
    const [recapType, setRecapType] = useState<any>(null);

    useEffect(() => {
        const loadRecapDetails = async () => {
            if (!organizationId || !recapId) return;

            const db = getFirestore();
            const recapDoc = await getDoc(doc(db, 'organizations', organizationId, 'recaps', recapId));

            if (recapDoc.exists()) {
                const recapData = recapDoc.data();
                setRecap(recapData);

                // Load the recap type details
                const recapTypeDoc = await getDoc(doc(db, 'organizations', organizationId, 'recapTypes', recapData.recapTypeId));
                if (recapTypeDoc.exists()) {
                    setRecapType(recapTypeDoc.data());
                }
            }
        };

        loadRecapDetails();
    }, [organizationId, recapId]);

    if (!recap || !recapType) {
        return <div>Loading...</div>;
    }

    return (
        <div className="recap-details">
            <div className="details-header">
                <button onClick={onBack} className="back-button">
                    ← Back
                </button>
                <h2>{recap.name}</h2>
            </div>

            <div className="details-content">
                <div className="details-section">
                    <h3>Recap Type: {recap.recapTypeName}</h3>
                    <p>Created on: {recap.date}</p>
                </div>

                <div className="details-section">
                    <h3>Recap Information</h3>
                    {recapType.fields.map((field: any) => (
                        <div key={field.id} className="field-display">
                            <label>{field.name}:</label>
                            <div className="field-value">
                                {field.type === 'multiSelect' ? (
                                    <ul>
                                        {Array.isArray(recap.fields[field.id]) &&
                                            recap.fields[field.id].map((value: string) => (
                                                <li key={value}>{value}</li>
                                            ))}
                                    </ul>
                                ) : (
                                    <span>{recap.fields[field.id]}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
