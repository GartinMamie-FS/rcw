export interface Service {
    name: string;
    description: string;
    organizationId: string;
    createdAt: Date;
}

export interface ServiceWithId {
    id: string;
    service: Service;
}
