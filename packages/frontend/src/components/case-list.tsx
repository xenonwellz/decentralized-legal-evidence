import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { contractService, Case } from "../services/contract";
import NewCaseForm from "./new-case-form";
import { Dialog, DialogTrigger } from "./ui/dialog";

interface CaseListProps {
    onCaseSelect: (caseId: number) => void;
}

export default function CaseList({ onCaseSelect }: CaseListProps) {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCase, setActiveCase] = useState<number | null>(null);

    // Load cases on mount
    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        try {
            setLoading(true);
            const allCases = await contractService.getAllCases();
            setCases(allCases);
            setError(null);
        } catch (err) {
            console.error("Error loading cases:", err);
            setError("Failed to load cases. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewEvidence = (caseId: number) => {
        setActiveCase(caseId);
        onCaseSelect(caseId);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const updateCaseStatus = async (caseId: number, isActive: boolean) => {
        try {
            await contractService.setCaseStatus(caseId, isActive);
            // Refresh the cases list
            loadCases();
        } catch (err) {
            console.error("Error updating case status:", err);
            setError("Failed to update case status.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loader">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative"
                role="alert"
            >
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Legal Cases</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            New Case
                        </Button>
                    </DialogTrigger>
                    <NewCaseForm onSuccess={loadCases} />
                </Dialog>
            </div>

            {cases.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">
                        No cases found. Create your first case!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.map((legalCase) => (
                        <Card
                            key={legalCase.id}
                            className={
                                legalCase.isActive
                                    ? "border-blue-200"
                                    : "border-gray-300 opacity-70"
                            }
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span className="truncate">
                                        {legalCase.name}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            legalCase.isActive
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {legalCase.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Created on {formatDate(legalCase.createdAt)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700">
                                    {legalCase.description}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleViewEvidence(legalCase.id)
                                    }
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    View Evidence
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        updateCaseStatus(
                                            legalCase.id,
                                            !legalCase.isActive
                                        )
                                    }
                                    className={
                                        legalCase.isActive
                                            ? "text-red-600 hover:text-red-800"
                                            : "text-green-600 hover:text-green-800"
                                    }
                                >
                                    {legalCase.isActive
                                        ? "Deactivate"
                                        : "Activate"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {activeCase !== null && (
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        Evidence for Case:{" "}
                        {cases.find((c) => c.id === activeCase)?.name}
                    </h2>
                    {/* Evidence list would go here - we'll create this component next */}
                </div>
            )}
        </div>
    );
}
