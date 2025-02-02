import { useState, useEffect } from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { format } from 'date-fns';
import { v4 as uuid } from 'uuid';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
import './AddDocument.css';

interface AddDocumentProps {
    participantId: string;
    onSaveComplete: () => void;
}

interface Location {
    name: string;
}

interface LocationWithId {
    id: string;
    location: Location;
}

export const AddDocument: React.FC<AddDocumentProps> = ({ participantId, onSaveComplete }) => {
    const { organizationId } = useOrganization();
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations, setLocations] = useState<LocationWithId[]>([]);
    const [completionDate, setCompletionDate] = useState(
        format(new Date(), 'MM/dd/yyyy')
    );
    const [documentTitle, setDocumentTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchLocations = async () => {
            if (!organizationId) return;

            const db = getFirestore();
            const locationsRef = collection(db, 'organizations', organizationId, 'locations');
            const snapshot = await getDocs(locationsRef);
            const locationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                location: doc.data() as Location
            }));
            setLocations(locationsData);
        };

        fetchLocations();
    }, [organizationId]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !organizationId) return;

        setIsUploading(true);
        const storage = getStorage();
        const fileRef = ref(storage, `organizations/${organizationId}/documents/${uuid()}_${selectedFile.name}`);

        try {
            const uploadTask = uploadBytesResumable(fileRef, selectedFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes);
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    setIsUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(fileRef);

                    const db = getFirestore();
                    await addDoc(
                        collection(db, 'organizations', organizationId, 'participants', participantId, 'participantDocuments'),
                        {
                            name: documentTitle,
                            location: selectedLocation,
                            date: completionDate,
                            fileUrl: downloadURL,
                            createdAt: serverTimestamp()
                        }
                    );

                    setIsUploading(false);
                    onSaveComplete();
                }
            );
        } catch (error) {
            console.error("Upload failed:", error);
            setIsUploading(false);
        }
    };

    return (
        <div className="add-document">
            <h3>Document Upload</h3>

            <div className="form-group">
                <label>Select and assign Location</label>
                <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    disabled={!organizationId}
                >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.location.name}>
                            {loc.location.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Form completion date *</label>
                <input
                    type="text"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Document title or name *</label>
                <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    disabled={!organizationId}
                />
            </div>

            <div className="form-group">
                <label>Select document to upload *</label>
                <p className="helper-text">Upload a staff document. PDF format supported. Max 10Mb.</p>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    disabled={!organizationId}
                />
            </div>

            {isUploading && (
                <div className="progress-bar">
                    <div
                        className="progress"
                        style={{ width: `${uploadProgress * 100}%` }}
                    ></div>
                </div>
            )}

            <div className="button-group">
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading || !organizationId}
                    className="upload-button"
                >
                    Upload
                </button>
            </div>
        </div>
    );
};
