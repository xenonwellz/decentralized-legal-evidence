import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Dialog, DialogTrigger } from "../components/ui/dialog";
import NewCaseForm from "../components/new-case-form";
import { contractService } from "../services/contract";
import { Plus, Eye } from "lucide-react";

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
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Legal Cases
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all your legal cases and their evidence
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Case
                        </Button>
                    </DialogTrigger>
                    <NewCaseForm onSuccess={loadCases} />
                </Dialog>
            </div>

            {cases.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-gray-300 mx-auto mb-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                        No cases found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Create your first legal case to start collecting and
                        managing evidence on the blockchain.
                    </p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                Create First Case
                            </Button>
                        </DialogTrigger>
                        <NewCaseForm onSuccess={loadCases} />
                    </Dialog>
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
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
