import React from 'react';
import { ManageRecapTypes } from '../ManageRecapTypes';
import './ManageOrganizationRecaps.css';

export const ManageOrganizationRecapsScreen: React.FC = () => {
    return (
        <div className="manage-organization-screen">
            <div className="header-container">
                <h2>Manage Recap Types</h2>
                <p>Create and configure templates for your organization's recaps</p>
            </div>
            <div className="content-container">
                <ManageRecapTypes />
            </div>
        </div>
    );
};
