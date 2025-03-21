import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Dialog, DialogTrigger } from "../components/ui/dialog";
import NewEvidenceForm from "../components/new-evidence";
import { contractService, Evidence, Case } from "../services/contract";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "../components/ui/tabs";
import EvidenceItem from "../components/evidence-item";
import { Plus, FileText } from "lucide-react";

interface EvidenceWithCaseInfo extends Evidence {
    caseTitle: string;
    caseId: number;
}

// Extended Case type with specific properties
interface ExtendedCase extends Case {
    title?: string;
    timestamp?: number;
}

export default function EvidencePage() {
    const [searchParams] = useSearchParams();
    const [evidence, setEvidence] = useState<EvidenceWithCaseInfo[]>([]);
    const [cases, setCases] = useState<ExtendedCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [activeCase, setActiveCase] = useState<number | null>(null);
    const caseIdParam = searchParams.get("caseId");

    const loadEvidence = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get case count
            const caseCount = await contractService.getCaseCount();
            const allCases: ExtendedCase[] = [];
            const allEvidence: EvidenceWithCaseInfo[] = [];

            // Get all cases and their evidence
            for (let i = 0; i < caseCount; i++) {
                const caseData = await contractService.getCase(i);
                const caseWithId: ExtendedCase = {
                    ...caseData,
                    title: caseData.name, // Map name to title
                    timestamp: caseData.createdAt, // Map createdAt to timestamp
                };

                allCases.push(caseWithId);
                if (caseIdParam !== null && parseInt(caseIdParam) !== i) {
                    continue;
                }

                const evidenceList = await contractService.getEvidenceForCase(
                    i
                );

                const evidenceWithCaseInfo = evidenceList.map((item) => ({
                    ...item,
                    caseTitle: caseWithId.title || "Untitled Case",
                    caseId: i,
                }));

                allEvidence.push(...evidenceWithCaseInfo);
            }

            setCases(allCases);
            setEvidence(allEvidence);
            if (caseIdParam !== null) {
                setActiveCase(parseInt(caseIdParam));
            }
        } catch (err) {
            console.error("Error loading evidence:", err);
            setError("Failed to load evidence. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [caseIdParam]);

    useEffect(() => {
        loadEvidence();
    }, [caseIdParam, loadEvidence]);

    // Function to format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Filter evidence based on active filter
    const getFilteredEvidence = () => {
        if (activeFilter === "all") {
            return evidence;
        } else if (activeFilter === "admissible") {
            return evidence.filter((item) => item.isAdmissible);
        } else if (activeFilter === "pending") {
            return evidence.filter((item) => !item.isAdmissible);
        }
        return evidence;
    };

    const handleSetAdmissibility = async (
        caseId: number,
        evidenceId: number,
        isAdmissible: boolean
    ) => {
        try {
            await contractService.setEvidenceAdmissibility(
                caseId,
                evidenceId,
                isAdmissible
            );
            // Refresh the evidence list
            loadEvidence();
        } catch (err) {
            console.error("Error updating evidence admissibility:", err);
            setError("Failed to update evidence status.");
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState error={error} onRetry={loadEvidence} />;
    }

    const filteredEvidence = getFilteredEvidence();

    return (
        <div>
            <PageHeader
                title="Evidence Management"
                subtitle={
                    activeCase !== null
                        ? `Evidence for Case: ${
                              cases.find((c) => c.id === activeCase)?.title ||
                              "Unknown Case"
                          }`
                        : "Manage all your case evidence in one place"
                }
                showAddButton={cases.length > 0}
                activeCase={activeCase}
                onSuccess={loadEvidence}
            />

            {evidence.length === 0 ? (
                <EmptyState
                    activeCase={activeCase}
                    casesExist={cases.length > 0}
                    onSuccess={loadEvidence}
                />
            ) : (
                <EvidenceTabs
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    filteredEvidence={filteredEvidence}
                    activeCase={activeCase}
                    formatDate={formatDate}
                    handleSetAdmissibility={handleSetAdmissibility}
                />
            )}
        </div>
    );
}

// Loading state component
function LoadingState() {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-pulse space-y-4 w-full max-w-4xl">
                <div className="h-8 bg-gray-200 w-1/4"></div>
                <div className="h-4 bg-gray-200 w-1/2"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

// Error state component
interface ErrorStateProps {
    error: string;
    onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
    return (
        <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 shadow-sm"
            role="alert"
        >
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <Button
                onClick={onRetry}
                variant="outline"
                className="mt-2 text-red-600 hover:text-red-800 border-red-300"
            >
                Try Again
            </Button>
        </div>
    );
}

// Page header component
interface PageHeaderProps {
    title: string;
    subtitle: string;
    showAddButton: boolean;
    activeCase: number | null;
    onSuccess: () => void;
}

function PageHeader({
    title,
    subtitle,
    showAddButton,
    activeCase,
    onSuccess,
}: PageHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
            </div>

            {showAddButton && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-5 w-5 mr-2" />
                            Add Evidence
                        </Button>
                    </DialogTrigger>
                    {activeCase !== null && (
                        <NewEvidenceForm
                            caseId={activeCase}
                            onSuccess={onSuccess}
                        />
                    )}
                </Dialog>
            )}
        </div>
    );
}

// Empty state component
interface EmptyStateProps {
    activeCase: number | null;
    casesExist: boolean;
    onSuccess: () => void;
}

function EmptyState({ activeCase, casesExist, onSuccess }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
                No evidence found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
                {activeCase !== null
                    ? "This case doesn't have any evidence yet. Add your first evidence item to this case."
                    : "No evidence has been added to any cases yet."}
            </p>

            {casesExist ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-5 w-5 mr-2" />
                            {activeCase !== null
                                ? "Add Evidence to this Case"
                                : "Add First Evidence"}
                        </Button>
                    </DialogTrigger>
                    {activeCase !== null && (
                        <NewEvidenceForm
                            caseId={activeCase}
                            onSuccess={onSuccess}
                        />
                    )}
                </Dialog>
            ) : (
                <Link
                    to="/cases"
                    className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                    Create a Case First
                </Link>
            )}
        </div>
    );
}

// Tabs component
interface EvidenceTabsProps {
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    filteredEvidence: EvidenceWithCaseInfo[];
    activeCase: number | null;
    formatDate: (timestamp: number) => string;
    handleSetAdmissibility: (
        caseId: number,
        evidenceId: number,
        isAdmissible: boolean
    ) => Promise<void>;
}

function EvidenceTabs({
    activeFilter,
    setActiveFilter,
    filteredEvidence,
    activeCase,
    handleSetAdmissibility,
}: EvidenceTabsProps) {
    return (
        <div className="mb-6">
            <Tabs
                defaultValue={activeFilter}
                onValueChange={setActiveFilter}
                className="w-full"
            >
                <TabsList className="">
                    <TabsTrigger value="all">All Evidence</TabsTrigger>
                    <TabsTrigger value="admissible">Admissible</TabsTrigger>
                    <TabsTrigger value="pending">Pending Review</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <EvidenceListView
                        evidence={filteredEvidence}
                        activeCase={activeCase}
                        handleSetAdmissibility={handleSetAdmissibility}
                    />
                </TabsContent>

                <TabsContent value="admissible" className="mt-6">
                    <EvidenceListView
                        evidence={filteredEvidence}
                        activeCase={activeCase}
                        handleSetAdmissibility={handleSetAdmissibility}
                    />
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                    <EvidenceListView
                        evidence={filteredEvidence}
                        activeCase={activeCase}
                        handleSetAdmissibility={handleSetAdmissibility}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Evidence list view component
interface EvidenceListViewProps {
    evidence: EvidenceWithCaseInfo[];
    activeCase: number | null;
    handleSetAdmissibility: (
        caseId: number,
        evidenceId: number,
        isAdmissible: boolean
    ) => Promise<void>;
}

function EvidenceListView({
    evidence,
    activeCase,
    handleSetAdmissibility,
}: EvidenceListViewProps) {
    return (
        <div className="grid grid-cols-1 gap-6">
            {evidence.map((item) => (
                <EvidenceItem
                    key={`${item.caseId}-${item.id}`}
                    id={item.id}
                    caseId={item.caseId}
                    caseTitle={item.caseTitle}
                    description={item.description}
                    timestamp={item.timestamp}
                    submitter={item.submitter}
                    metadataCID={item.metadataCID}
                    isAdmissible={item.isAdmissible}
                    showCaseLink={!activeCase}
                    onSetAdmissibility={handleSetAdmissibility}
                />
            ))}
        </div>
    );
}
