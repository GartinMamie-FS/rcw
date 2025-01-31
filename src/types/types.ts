// Timestamp type from Firebase
import { Timestamp } from 'firebase/firestore';

interface OrganizationSettings {
    theme?: string;
    features?: string[];
    // Add other settings as needed
}

interface Organization {
    id: string;
    name: string;
    createdAt: Timestamp;
    settings: OrganizationSettings;
}

interface User {
    id: string;
    organizationId: string;
    email: string;
    role: 'admin' | 'staff' | 'developer';
    name: string;
}

interface Location {
    id: string;
    organizationId: string;
    name: string;
    address: string;
}

interface Service {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    category?: string;
    duration?: number;
    capacity?: number;
}

interface Program {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
    locationId?: string;
    services?: string[]; // Array of service IDs
}

interface PersonalInfo {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    phone?: string;
    email?: string;
    address?: string;
}

interface ProgramEnrollment {
    programId: string;
    enrollmentDate: Date;
    status: 'active' | 'completed' | 'withdrawn';
}

interface Participant {
    id: string;
    organizationId: string;
    personalInfo: PersonalInfo;
    enrollments: ProgramEnrollment[];
}

export type {
    Organization,
    OrganizationSettings,
    User,
    Location,
    Service,
    Program,
    PersonalInfo,
    ProgramEnrollment,
    Participant
};
