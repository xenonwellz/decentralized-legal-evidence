import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
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

export default function CreateEvidencePage() {
    const { caseId } = useParams();
    const [description, setDescription] = useState("");
    const [fileSelected, setFileSelected] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    if (!caseId || isNaN(Number(caseId))) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3"
                    role="alert"
                >
                    <p className="font-bold">Error</p>
                    <p>Invalid case ID. Please select a valid case.</p>
                    <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => navigate("/cases")}
                    >
                        Go to Cases
                    </Button>
                </div>
            </div>
        );
    }

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
            await contractService.addEvidence(
                Number(caseId),
                description,
                mockCID
            );

            // Navigate to evidence page with the case ID after success
            navigate(`/evidence?caseId=${caseId}`);
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Submit New Evidence
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Upload and document evidence for Case #{caseId}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/evidence?caseId=${caseId}`)}
                >
                    Cancel
                </Button>
            </div>

            <div className="bg-white border-t border-gray-300 pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3"
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
                            className="flex w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g., Witness statement dated 04/15/2023"
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Upload File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 p-6 text-center relative">
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
                                    <p className="text-green-600">
                                        File selected
                                    </p>
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

                    <div className="flex mt-6">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full"
                        >
                            {submitting ? "Submitting..." : "Submit Evidence"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
