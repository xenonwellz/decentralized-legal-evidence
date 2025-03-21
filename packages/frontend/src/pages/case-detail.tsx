import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Dialog, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import NewEvidenceForm from "../components/new-evidence-form";
import { contractService, Case, Evidence } from "../services/contract";
import { FileText } from "lucide-react";
import EvidenceList from "../components/evidence-list";
// Extended Case type that includes evidence count and other metadata
interface ExtendedCase extends Case {
    evidenceCount: number;
}

export default function CaseDetailPage() {
    const { caseId } = useParams<{ caseId: string }>();
    const parsedCaseId = caseId ? parseInt(caseId) : undefined;

    const [caseData, setCaseData] = useState<ExtendedCase | null>(null);
    const [evidence, setEvidence] = useState<Evidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to format timestamp to readable date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    // Load case data and evidence
    const loadCaseData = useCallback(async () => {
        if (!parsedCaseId && parsedCaseId !== 0) return;

        try {
            setLoading(true);

            // Load case details
            const caseDetails = await contractService.getCase(parsedCaseId);

            // Load evidence for the case
            const evidenceList = await contractService.getEvidenceForCase(
                parsedCaseId
            );

            // Create extended case with evidence count
            const extendedCase: ExtendedCase = {
                ...caseDetails,
                evidenceCount: evidenceList.length,
            };

            setCaseData(extendedCase);
            setEvidence(evidenceList);
            setError(null);
        } catch (err) {
            console.error("Error loading case data:", err);
            setError("Failed to load case information. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [parsedCaseId]);

    useEffect(() => {
        loadCaseData();
    }, [loadCaseData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <Button
                    onClick={loadCaseData}
                    variant="outline"
                    className="mt-4"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4 rounded">
                <p className="font-bold">Case Not Found</p>
                <p>
                    The requested case could not be found or may have been
                    deleted.
                </p>
                <Link to="/cases">
                    <Button variant="outline" className="mt-4">
                        Back to Cases
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Case Header */}
            <div className="flex justify-between items-start pb-6 mb-6 border-b border-gray-300">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            to="/cases"
                            className="hover:underline text-sm text-muted-foreground"
                        >
                            ← Back to Cases
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {caseData.name || `Unnamed Case #${caseData.id}`}
                        <Badge variant="outline">Case #{caseData.id}</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Created on {formatDate(Number(caseData.timestamp))}
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        to={`/evidence?caseId=${caseData.id}`}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        View in Evidence Manager
                    </Link>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Add Evidence</Button>
                        </DialogTrigger>
                        <NewEvidenceForm
                            caseId={parsedCaseId as number}
                            onSuccess={loadCaseData}
                        />
                    </Dialog>
                </div>
            </div>

            {/* Case Description */}
            <div className="mb-8 p-6 border border-gray-300">
                <h2 className="text-xl font-bold mb-4">Case Details</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-gray-700">
                            Description
                        </h3>
                        <p className="mt-1 text-gray-600">
                            {caseData.description || "No description provided"}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-100 border">
                            <h3 className="font-medium text-gray-700">
                                Total Evidence
                            </h3>
                            <p className="mt-1 text-2xl font-semibold">
                                {caseData.evidenceCount}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-100 border">
                            <h3 className="font-medium text-gray-700">
                                Admissible Evidence
                            </h3>
                            <p className="mt-1 text-2xl font-semibold text-green-600">
                                {evidence.filter((e) => e.isAdmissible).length}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-100 border">
                            <h3 className="font-medium text-gray-700">
                                Pending Review
                            </h3>
                            <p className="mt-1 text-2xl font-semibold text-yellow-600">
                                {evidence.filter((e) => !e.isAdmissible).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evidence Section */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Evidence
                </h2>

                {evidence.length === 0 ? (
                    <div className="border border-gray-300 p-8 flex justify-between">
                        <div className="flex items-center gap-4">
                            <FileText className="h-16 w-16 text-gray-300 mb-4" />
                            <div>
                                <h3 className="text-xl font-medium text-gray-700 mb-2">
                                    No evidence found
                                </h3>
                                <p className="text-gray-500 max-w-md mb-6">
                                    This case doesn't have any evidence yet. Add
                                    your first evidence item to this case.
                                </p>
                            </div>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>Add First Evidence</Button>
                            </DialogTrigger>
                            <NewEvidenceForm
                                caseId={parsedCaseId as number}
                                onSuccess={loadCaseData}
                            />
                        </Dialog>
                    </div>
                ) : (
                    <EvidenceList caseId={parsedCaseId as number} />
                )}
            </div>
        </div>
    );
}
