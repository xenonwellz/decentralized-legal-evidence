import { useState, useEffect } from "react";
import {
    Link,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { Button } from "../components/ui/button";
import axios from "axios";
import {
    FileText,
    ArrowLeft,
    Check,
    X,
    Download,
    File,
    Image,
    Video,
    Music,
} from "lucide-react";
import { contractService, Evidence } from "../services/contract";
import { downloadFromIPFS, getIpfsUrl } from "../services/ipfs";

// Define API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Define interface for metadata structure
interface EvidenceMetadata {
    name: string;
    description: string;
    image?: string;
    properties: {
        type: string;
        size: number;
        lastModified: number;
        dateAdded: string;
        caseId: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export default function ViewEvidencePage() {
    const { caseId, evidenceId } = useParams();
    const [searchParams] = useSearchParams();
    const queryEvidenceId = searchParams.get("evidenceId");
    const queryCaseId = searchParams.get("caseId");

    // Use either URL params or query params
    const evidenceIdToUse = evidenceId || queryEvidenceId;
    const caseIdToUse = caseId || queryCaseId;

    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [caseTitle, setCaseTitle] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<EvidenceMetadata | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [metadataError, setMetadataError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvidence = async () => {
            if (
                !caseIdToUse ||
                !evidenceIdToUse ||
                isNaN(Number(caseIdToUse)) ||
                isNaN(Number(evidenceIdToUse))
            ) {
                setError("Invalid case or evidence ID");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch the evidence details using axios
                try {
                    const response = await axios.get(
                        `${API_URL}/api/evidence/${caseIdToUse}/${evidenceIdToUse}`
                    );
                    setEvidence(response.data);
                } catch (error) {
                    console.error("Error fetching evidence:", error);

                    // Fallback to contract service if API is not available
                    const fetchedEvidence = await contractService.getEvidence(
                        Number(caseIdToUse),
                        Number(evidenceIdToUse)
                    );
                    setEvidence(fetchedEvidence);
                }

                // Get case details to display the title
                try {
                    const caseResponse = await axios.get(
                        `${API_URL}/api/cases/${caseIdToUse}`
                    );
                    setCaseTitle(
                        caseResponse.data.title || caseResponse.data.name
                    );
                } catch (error) {
                    console.error("Error fetching case details:", error);
                    // Fallback to contract service
                    const caseData = await contractService.getCase(
                        Number(caseIdToUse)
                    );
                    setCaseTitle(caseData.title || caseData.name);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching evidence:", err);
                setError(
                    "Failed to load evidence details. Please try again later."
                );
                setLoading(false);
            }
        };

        fetchEvidence();
    }, [caseIdToUse, evidenceIdToUse]);

    // Fetch metadata when evidence is loaded
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!evidence?.metadataCID) return;

            try {
                setMetadataLoading(true);
                setMetadataError(null);

                // Download the metadata file from IPFS
                const ipfsUri = `ipfs://${evidence.metadataCID}`;
                const metadataText = await downloadFromIPFS(ipfsUri);

                try {
                    // Parse the metadata as JSON
                    const parsedMetadata = JSON.parse(metadataText);
                    setMetadata(parsedMetadata);
                } catch (parseError) {
                    console.error("Error parsing metadata JSON:", parseError);
                    setMetadataError(
                        "The metadata is not in valid JSON format"
                    );
                }

                setMetadataLoading(false);
            } catch (err) {
                console.error("Error fetching metadata from IPFS:", err);
                setMetadataError("Failed to fetch metadata from IPFS");
                setMetadataLoading(false);
            }
        };

        if (evidence) {
            fetchMetadata();
        }
    }, [evidence]);

    // Helper function to get file size in human-readable format
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Helper function to get file icon based on type
    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("image/")) {
            return <Image className="h-12 w-12 text-blue-500" />;
        } else if (fileType.startsWith("video/")) {
            return <Video className="h-12 w-12 text-red-500" />;
        } else if (fileType.startsWith("audio/")) {
            return <Music className="h-12 w-12 text-purple-500" />;
        } else {
            return <File className="h-12 w-12 text-gray-500" />;
        }
    };

    const handleSetAdmissibility = async (isAdmissible: boolean) => {
        if (!evidence || !caseIdToUse) return;

        try {
            setLoading(true);

            // Try to update using API first
            try {
                await axios.put(
                    `${API_URL}/api/evidence/${caseIdToUse}/${evidence.id}/admissibility`,
                    {
                        isAdmissible,
                    }
                );
            } catch (error) {
                console.error("Error updating evidence admissibility:", error);
                // Fallback to contract service
                await contractService.setEvidenceAdmissibility(
                    Number(caseIdToUse),
                    evidence.id,
                    isAdmissible
                );
            }

            // Update the local state
            setEvidence({ ...evidence, isAdmissible });
            setLoading(false);
        } catch (err) {
            console.error("Error updating evidence admissibility:", err);
            setError("Failed to update evidence status.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse space-y-4 w-full max-w-4xl">
                        <div className="h-8 bg-gray-200 w-1/4"></div>
                        <div className="h-4 bg-gray-200 w-1/2"></div>
                        <div className="h-24 bg-gray-200"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !evidence) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3"
                    role="alert"
                >
                    <p className="font-bold">Error</p>
                    <p>{error || "Evidence not found"}</p>
                    <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                            navigate(
                                caseIdToUse
                                    ? `/evidence?caseId=${caseIdToUse}`
                                    : "/evidence"
                            )
                        }
                    >
                        Back to Evidence List
                    </Button>
                </div>
            </div>
        );
    }

    // Format date
    const formattedDate = new Date(
        evidence.timestamp * 1000
    ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    // Get the download URL for the actual file
    const getDownloadUrl = () => {
        if (!metadata?.image) return null;

        const cid = metadata.image.replace("ipfs://", "");
        return getIpfsUrl(`ipfs://${cid}`);
    };

    const downloadUrl = metadata?.image ? getDownloadUrl() : null;

    return (
        <div>
            <div className="flex flex-col mb-6">
                <div>
                    <Link
                        to={
                            caseIdToUse
                                ? `/evidence?caseId=${caseIdToUse}`
                                : "/evidence"
                        }
                        className="mr-4 flex items-center text-gray-600 hover:text-gray-800 mb-4 text-sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </div>

                <h1 className="text-xl font-bold text-gray-800">
                    Evidence Detail
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Viewing evidence for case:{" "}
                    {caseTitle || `Case #${caseIdToUse}`}
                </p>
            </div>

            <div className="bg-white border-t border-gray-300 pt-6">
                {/* Evidence Status Banner */}
                <div
                    className={`mb-6 p-3 flex flex-col md:flex-row items-start md:items-center justify-between ${
                        evidence.isAdmissible
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-yellow-50 border border-yellow-200 text-yellow-800"
                    }`}
                >
                    <div className="flex items-center mb-2 md:mb-0">
                        {evidence.isAdmissible ? (
                            <Check className="h-5 w-5 mr-2" />
                        ) : (
                            <FileText className="h-5 w-5 mr-2" />
                        )}
                        <span>
                            {evidence.isAdmissible
                                ? "This evidence has been marked as admissible"
                                : "This evidence is pending review"}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={
                                evidence.isAdmissible ? "default" : "outline"
                            }
                            className={
                                evidence.isAdmissible
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                            }
                            onClick={() => handleSetAdmissibility(true)}
                            disabled={evidence.isAdmissible}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Admissible
                        </Button>

                        <Button
                            size="sm"
                            variant={
                                !evidence.isAdmissible ? "default" : "outline"
                            }
                            className={
                                !evidence.isAdmissible
                                    ? "bg-red-600 hover:bg-red-700"
                                    : ""
                            }
                            onClick={() => handleSetAdmissibility(false)}
                            disabled={!evidence.isAdmissible}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Mark Inadmissible
                        </Button>
                    </div>
                </div>

                {/* Evidence Details */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-medium text-gray-800 mb-2">
                            Evidence Description
                        </h2>
                        <p className="text-gray-600">{evidence.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">
                                Submitted By
                            </h3>
                            <p className="text-gray-800 truncate">
                                {evidence.submitter}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">
                                Submission Date
                            </h3>
                            <p className="text-gray-800">{formattedDate}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Content CID
                        </h3>
                        <div className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm break-all">
                            {evidence.metadataCID}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            This is the unique identifier for retrieving the
                            evidence metadata from IPFS.
                        </p>
                    </div>

                    {/* Metadata Information */}
                    {metadataLoading && (
                        <div className="pt-4 border-t border-gray-200">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">
                                Evidence File Information
                            </h2>
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-pulse text-gray-500">
                                    Loading metadata...
                                </div>
                            </div>
                        </div>
                    )}

                    {metadataError && (
                        <div className="pt-4 border-t border-gray-200">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">
                                Evidence File Information
                            </h2>
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4">
                                <p className="font-medium">
                                    Error Loading Metadata
                                </p>
                                <p className="text-sm">{metadataError}</p>
                            </div>
                        </div>
                    )}

                    {!metadataLoading && !metadataError && metadata && (
                        <div className="pt-4 border-t border-gray-200">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">
                                Evidence File Information
                            </h2>

                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-md">
                                <div className="flex items-start">
                                    <div className="mr-6">
                                        {metadata.properties?.type ? (
                                            getFileIcon(
                                                metadata.properties.type
                                            )
                                        ) : (
                                            <FileText className="h-12 w-12 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {metadata.name ||
                                                    "Unnamed File"}
                                            </h3>
                                            {metadata.properties?.type && (
                                                <p className="text-sm text-gray-500">
                                                    {metadata.properties.type}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {metadata.properties?.size && (
                                                <div>
                                                    <span className="block text-gray-500">
                                                        File Size:
                                                    </span>
                                                    <span>
                                                        {formatFileSize(
                                                            metadata.properties
                                                                .size
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {metadata.properties?.dateAdded && (
                                                <div>
                                                    <span className="block text-gray-500">
                                                        Added:
                                                    </span>
                                                    <span>
                                                        {new Date(
                                                            metadata.properties.dateAdded
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {downloadUrl && (
                                            <div className="pt-4">
                                                <Button
                                                    variant="default"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    onClick={() =>
                                                        window.open(
                                                            downloadUrl,
                                                            "_blank"
                                                        )
                                                    }
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download Original File
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional metadata information */}
                            {metadata.image && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                                        File Content CID
                                    </h3>
                                    <div className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm break-all">
                                        {metadata.image.replace("ipfs://", "")}
                                    </div>
                                </div>
                            )}

                            {/* Preview section for images */}
                            {metadata.properties?.type?.startsWith("image/") &&
                                downloadUrl && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                                            Image Preview
                                        </h3>
                                        <div className="border border-gray-200 rounded-md overflow-hidden">
                                            <img
                                                src={downloadUrl}
                                                alt="Evidence"
                                                className="max-w-full h-auto object-contain mx-auto"
                                                style={{ maxHeight: "400px" }}
                                            />
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    {/* View on IPFS Gateway Link */}
                    <div className="pt-4 mt-4 border-t border-gray-200 flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                window.open(
                                    `https://ipfs.io/ipfs/${evidence.metadataCID}`,
                                    "_blank"
                                )
                            }
                        >
                            View Metadata on IPFS Gateway
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
