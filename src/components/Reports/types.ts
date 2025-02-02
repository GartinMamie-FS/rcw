export interface ServiceWithParticipantCount {
    name: string;
    participantCount: number;
}

export interface ProgramWithParticipantCount {
    name: string;
    participantCount: number;
}

export interface LocationWithParticipantCount {
    name: string;
    participantCount: number;
}

export enum ReportType {
    ORGANIZATION = 'ORGANIZATION',
    PROGRAM = 'PROGRAM',
    RECAPS = 'recaps'
}