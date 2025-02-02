import React, { useState } from 'react';
import { AddStaffScreen } from './AddStaffScreen';
import { ViewStaffScreen } from './ViewStaffScreen';
import './AdminOrganizationManagement.css';

export const AdminOrganizationManagement: React.FC = () => {
    const [selectedView, setSelectedView] = useState<'add' | 'view'>('add');

    return (
        <div className="admin-org-management">
            <div className="navigation-panel">
                <div className="nav-links">
                    <button
                        className={`nav-link ${selectedView === 'add' ? 'active' : ''}`}
                        onClick={() => setSelectedView('add')}
                    >
                        Add Staff
                    </button>
                    <button
                        className={`nav-link ${selectedView === 'view' ? 'active' : ''}`}
                        onClick={() => setSelectedView('view')}
                    >
                        View Staff
                    </button>
                </div>
            </div>
            <div className="content-panel">
                {selectedView === 'add' ? <AddStaffScreen /> : <ViewStaffScreen />}
            </div>
        </div>
    );
};
