import React, { useState } from 'react';
import { AddStaffScreen } from './AddStaffScreen';
import { ViewStaffScreen } from './ViewStaffScreen';
import './AdminOrganizationManagement.css';

interface AdminOrganizationManagementProps {
    organizationId: string;
}

export const AdminOrganizationManagement: React.FC<AdminOrganizationManagementProps> = ({ organizationId }) => {
    const [selectedView, setSelectedView] = useState<'add' | 'view'>('add');

    return (
        <div className="org-management-container">
            <div className="org-management-nav-panel">
                <div className="org-management-nav-links">
                    <button
                        className={`org-management-nav-button ${selectedView === 'add' ? 'active' : ''}`}
                        onClick={() => setSelectedView('add')}
                    >
                        Add Staff
                    </button>
                    <button
                        className={`org-management-nav-button ${selectedView === 'view' ? 'active' : ''}`}
                        onClick={() => setSelectedView('view')}
                    >
                        View Staff
                    </button>
                </div>
            </div>
            <div className="org-management-content">
                {selectedView === 'add' ?
                    <AddStaffScreen organizationId={organizationId} /> :
                    <ViewStaffScreen organizationId={organizationId} />
                }
            </div>
        </div>
    );
};