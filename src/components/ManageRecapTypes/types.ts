export interface RecapField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'multiSelect';
    required: boolean;
    options?: string[];
}

export interface RecapType {
    id: string;
    name: string;
    fields: RecapField[];
}