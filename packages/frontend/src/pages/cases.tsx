import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { contractService } from "../services/contract";
import { Plus, Eye, Briefcase } from "lucide-react";

interface CaseWithEvidence {
    id: number;
    title?: string;
    description?: string | undefined;
    timestamp?: number;
    owner?: string;
    evidenceCount: number;
}

export default function Cases() {
    const [cases, setCases] = useState<CaseWithEvidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCases = async () => {
        try {
            setLoading(true);
            setError(null);

            const caseCount = await contractService.getCaseCount();
            const caseItems: CaseWithEvidence[] = [];

            for (let i = 0; i < caseCount; i++) {
                const caseData = await contractService.getCase(i);
                const evidenceList = await contractService.getEvidenceForCase(
                    i
                );

                caseItems.push({
                    ...caseData,
                    id: i,
                    evidenceCount: evidenceList.length,
                });
            }

            setCases(caseItems);
        } catch (err) {
            console.error("Error loading cases:", err);
            setError("Failed to load cases. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCases();
    }, []);

    // Function to format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-pulse space-y-4 w-full max-w-4xl">
                    <div className="h-8 bg-gray-200 w-1/4"></div>
                    <div className="h-4 bg-gray-200 w-1/2"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 shadow-sm"
                role="alert"
            >
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <Button
                    onClick={loadCases}
                    variant="outline"
                    className="mt-2 text-red-600 hover:text-red-800 border-red-300"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Legal Cases
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all your legal cases and their evidence
                    </p>
                </div>
                <Link to="/cases/create" className="mt-4 md:mt-0">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Case
                    </Button>
                </Link>
            </div>

            {cases.length === 0 ? (
                <div className="bg-white border border-gray-300 p-8 text-center">
                    <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                        No cases found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Create your first legal case to start collecting and
                        managing evidence on the blockchain.
                    </p>
                    <Link to="/cases/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Case
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {cases.map((caseItem) => (
                        <div
                            key={caseItem.id}
                            className="border border-gray-300 rounded"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            <Link
                                                to={`/cases/${caseItem.id}`}
                                                className="hover:text-blue-600"
                                            >
                                                {caseItem.title ||
                                                    "Untitled Case"}
                                            </Link>
                                        </h2>
                                        <p className="text-gray-500 text-sm">
                                            Created on{" "}
                                            {caseItem.timestamp
                                                ? formatDate(caseItem.timestamp)
                                                : "Unknown date"}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className="py-1 px-3 bg-blue-50 text-blue-700 rounded-full">
                                            {caseItem.evidenceCount} Evidence
                                            Items
                                        </span>
                                        <span className="py-1 px-3 bg-gray-50 text-gray-600 rounded-full truncate max-w-xs">
                                            Owner:{" "}
                                            {caseItem?.owner?.substring(0, 6)}
                                            ...
                                            {caseItem?.owner?.substring(38)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-600">
                                    {caseItem.description ||
                                        "No description provided"}
                                </p>
                                <div className="flex mt-6 space-x-6">
                                    <Link
                                        to={`/cases/${caseItem.id}`}
                                        className="text-gray-600 hover:text-gray-900 flex items-center text-sm font-medium"
                                    >
                                        <Button
                                            variant="outline"
                                            className="border-gray-300 cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View Details
                                        </Button>
                                    </Link>

                                    <Link
                                        to={`/evidence/create/${caseItem.id}`}
                                        className="text-gray-600 hover:text-gray-900 flex items-center text-sm font-medium"
                                    >
                                        <Button
                                            variant="outline"
                                            className="border-gray-300 cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Evidence
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
