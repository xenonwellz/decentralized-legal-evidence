import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { contractService, Case } from "../services/contract";
import { uploadMetadataToIPFS, uploadToIPFS } from "../services/ipfs";

interface NewEvidenceFormProps {
    caseId?: number;
    onSuccess: () => void;
}

export default function NewEvidenceForm({
    caseId,
    onSuccess,
}: NewEvidenceFormProps) {
    const [description, setDescription] = useState("");
    const [metadataCID, setMetadataCID] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<number | null>(
        caseId !== undefined ? caseId : null
    );
    const [cases, setCases] = useState<Case[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load available cases if no case ID is provided
    useEffect(() => {
        if (caseId === undefined) {
            loadCases();
        }
    }, [caseId]);

    const loadCases = async () => {
        try {
            const casesList = await contractService.getAllCases();
            setCases(casesList);
        } catch (err) {
            console.error("Error loading cases:", err);
            setError("Failed to load cases");
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFile = async (): Promise<string | null> => {
        if (!file) {
            return null;
        }

        try {
            setUploadingStatus("Uploading file to IPFS...");
            const fileCid = await uploadToIPFS(file);

            // Create metadata object with details about the evidence
            const metadata = {
                name: description.slice(0, 100), // Short name based on description
                description: description,
                image: `ipfs://${fileCid}`,
                properties: {
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    dateAdded: new Date().toISOString(),
                    caseId: selectedCaseId,
                },
            };

            setUploadingStatus("Uploading metadata to IPFS...");
            const metadataCid = await uploadMetadataToIPFS(metadata);
            return metadataCid;
        } catch (error) {
            console.error("Error uploading to IPFS:", error);
            throw new Error("Failed to upload evidence to IPFS");
        } finally {
            setUploadingStatus(null);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!selectedCaseId && selectedCaseId !== 0) {
            setError("Please select a case");
            return;
        }

        if (!description) {
            setError("Please provide a description");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            let cidToUse = metadataCID;

            // If a file was selected, upload it to IPFS
            if (file) {
                try {
                    const uploadedCid = await uploadFile();
                    if (uploadedCid) {
                        cidToUse = uploadedCid;
                    } else {
                        throw new Error("Failed to get CID from IPFS upload");
                    }
                } catch (err) {
                    console.error("IPFS upload error:", err);
                    setError(
                        "Failed to upload file to IPFS. Please try again."
                    );
                    setSubmitting(false);
                    return;
                }
            } else if (!metadataCID) {
                setError(
                    "Please either upload a file or provide a metadata CID"
                );
                setSubmitting(false);
                return;
            }

            await contractService.addEvidence(
                selectedCaseId,
                description,
                cidToUse
            );

            // Reset form
            setDescription("");
            setMetadataCID("");
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            // Call success callback
            onSuccess();
        } catch (err) {
            console.error("Error submitting evidence:", err);
            setError("Failed to submit evidence. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Add New Evidence</DialogTitle>
                <DialogDescription>
                    Submit evidence to be recorded on the blockchain.
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Case Selection - only show if case ID wasn't provided */}
                {caseId === undefined && (
                    <div className="space-y-2">
                        <label
                            htmlFor="case"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Select Case
                        </label>
                        <select
                            id="case"
                            value={
                                selectedCaseId !== null ? selectedCaseId : ""
                            }
                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                setSelectedCaseId(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : null
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select a case</option>
                            {cases.map((caseItem) => (
                                <option key={caseItem.id} value={caseItem.id}>
                                    {caseItem.name || `Case ${caseItem.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Evidence Description */}
                <div className="space-y-2">
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Evidence Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        required
                        placeholder="Describe the evidence"
                    />
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                    <label
                        htmlFor="file"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Upload Evidence File
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="file"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                    </div>
                    {file && (
                        <p className="text-sm text-gray-600">
                            Selected file: {file.name} (
                            {(file.size / 1024).toFixed(2)} KB)
                        </p>
                    )}
                    <p className="text-xs text-gray-500">
                        Upload files up to 100MB. The file will be stored on
                        IPFS.
                    </p>
                </div>

                {/* OR Separator */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                </div>

                {/* Metadata CID Manual Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="metadataCID"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Existing Metadata CID (IPFS Content ID)
                    </label>
                    <input
                        id="metadataCID"
                        type="text"
                        value={metadataCID}
                        onChange={(e) => setMetadataCID(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="IPFS CID (e.g. Qm...)"
                        disabled={!!file}
                    />
                    <p className="text-xs text-gray-500">
                        If you already have an IPFS CID for your evidence, enter
                        it here.
                    </p>
                </div>

                {uploadingStatus && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                        <div className="flex items-center">
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {uploadingStatus}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={submitting || !!uploadingStatus}
                        className={`w-full ${
                            submitting || !!uploadingStatus
                                ? "bg-purple-400"
                                : "bg-purple-600 hover:bg-purple-700"
                        }`}
                    >
                        {submitting ? "Submitting..." : "Add Evidence"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
