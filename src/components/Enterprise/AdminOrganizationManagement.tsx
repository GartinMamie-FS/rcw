import React, { useState } from 'react';
import { AddStaffScreen } from './AddStaffScreen';
import { ViewStaffScreen } from './ViewStaffScreen';
import './AdminOrganizationManagement.css';

interface AdminOrganizationManagementProps {
    organizationId: string;
}

export const AdminOrganizationManagement: React.FC<AdminOrganizationManagementProps> = ({ organizationId }) => {
    const [selectedView, setSelectedView] = useState<'add' | 'view'>('view');

    return (
        <div className="group-engagements-screen">
            <h2>Manage Organization Staff</h2>

            <div className="content-grid">
                {/* Navigation Card */}
                <div className="nav-card">
                    <div className="nav-buttons">
                        <button
                            onClick={() => setSelectedView('view')}
                            className={`nav-button ${selectedView === 'view' ? 'active' : ''}`}
                        >
                            View Staff
                        </button>
                        <button
                            onClick={() => setSelectedView('add')}
                            className={`nav-button ${selectedView === 'add' ? 'active' : ''}`}
                        >
                            Add Staff
                        </button>
                    </div>
                </div>

                {/* Content Card */}
                <div className="content-card">
                    {selectedView === 'add' ? (
                        <AddStaffScreen organizationId={organizationId}/>
                    ) : (
                        <ViewStaffScreen organizationId={organizationId}/>
                    )}
                </div>
            </div>
        </div>
    );
};
