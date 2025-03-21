import { useState, useEffect } from "react";
import {
    Link,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { Button } from "../components/ui/button";
import axios from "axios";
import { FileText, ArrowLeft, Check, X } from "lucide-react";
import { contractService, Evidence } from "../services/contract";

// Define API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
                    className={`mb-6 p-3 flex items-center justify-between ${
                        evidence.isAdmissible
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-yellow-50 border border-yellow-200 text-yellow-800"
                    }`}
                >
                    <div className="flex items-center">
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

                    <div className="flex space-x-2">
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
                            evidence file from IPFS.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">
                            Evidence Preview
                        </h2>
                        <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col items-center justify-center h-64">
                            <FileText className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 text-sm">
                                Preview not available
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                // This would typically link to IPFS gateway with the CID
                                onClick={() =>
                                    window.open(
                                        `https://ipfs.io/ipfs/${evidence.metadataCID}`,
                                        "_blank"
                                    )
                                }
                            >
                                View on IPFS
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
