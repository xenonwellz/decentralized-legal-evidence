import { useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { contractService } from "../services/contract";

// Mock CID generator (in a real app, this would be done through web3.storage or similar)
const generateMockCID = () => {
    const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = 46; // Typical CID v1 length
    let result = "Qm"; // Typical prefix for CIDv0
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result;
};

interface NewEvidenceFormProps {
    caseId: number;
    onSuccess: () => void;
}

export default function NewEvidenceForm({
    caseId,
    onSuccess,
}: NewEvidenceFormProps) {
    const [description, setDescription] = useState("");
    const [fileSelected, setFileSelected] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validation
        if (!description.trim() || !fileSelected) {
            setError("Please fill in all fields and upload a file");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Generate a mock CID (in a real app, this would be the CID from IPFS upload)
            const mockCID = generateMockCID();

            // Submit the evidence to the blockchain
            await contractService.addEvidence(caseId, description, mockCID);

            // Reset form
            setDescription("");
            setFileSelected(false);

            // Call success callback
            onSuccess();
        } catch (err) {
            console.error("Error submitting evidence:", err);
            setError("Failed to submit evidence. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = () => {
        setFileSelected(true);
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Submit New Evidence</DialogTitle>
                <DialogDescription>
                    Upload and document evidence for this case.
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {error && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative"
                        role="alert"
                    >
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label
                        htmlFor="description"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Evidence Description
                    </label>
                    <input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="e.g., Witness statement dated 04/15/2023"
                        disabled={submitting}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Upload File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center relative">
                        <div className="flex justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-6 w-6 text-gray-400"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            {fileSelected ? (
                                <p className="text-green-600">File selected</p>
                            ) : (
                                <p>Click or drag files to upload</p>
                            )}
                        </div>
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={submitting}
                            onChange={handleFileChange}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Note: Files will be stored on IPFS, a decentralized
                        storage system.
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? "Submitting..." : "Submit Evidence"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
