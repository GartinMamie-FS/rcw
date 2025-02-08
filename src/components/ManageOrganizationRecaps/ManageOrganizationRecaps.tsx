import React from 'react';
import { ManageRecapTypes } from '../ManageRecapTypes';
import './ManageOrganizationRecaps.css';

interface ManageOrganizationRecapsScreenProps {
    organizationId: string;
}

export const ManageOrganizationRecapsScreen: React.FC<ManageOrganizationRecapsScreenProps> = ({ organizationId }) => {
    return (
        <div className="manage-organization-screen">
            <div className="header-container">
                <h2>Public Awareness/Impact Reports</h2>
                <p>Create and configure templates for your organization's reports (Examples: Community Collaboration, Narcan Distribution)</p>
            </div>
            <div className="content-container">
                <ManageRecapTypes organizationId={organizationId} />
            </div>
        </div>
    );
};


