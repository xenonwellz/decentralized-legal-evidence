import { useState, useEffect, useCallback } from "react";
import { contractService, Evidence } from "../services/contract";
import EvidenceItem from "./evidence-item";

interface EvidenceListProps {
    caseId: number;
}

export default function EvidenceList({ caseId }: EvidenceListProps) {
    const [evidence, setEvidence] = useState<Evidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEvidence = useCallback(async () => {
        try {
            setLoading(true);
            const evidenceList = await contractService.getEvidenceForCase(
                caseId
            );
            setEvidence(evidenceList);
            setError(null);
        } catch (err) {
            console.error("Error loading evidence:", err);
            setError("Failed to load evidence. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [caseId]);

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

    useEffect(() => {
        if (caseId !== undefined) {
            loadEvidence();
        }
    }, [caseId, loadEvidence]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
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
        <div className="mt-4">
            {evidence.length === 0 ? (
                <div className="text-center py-6 border border-gray-300">
                    <p className="text-gray-500">
                        No evidence has been submitted for this case yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {evidence.map((item) => (
                        <EvidenceItem
                            key={`${caseId}-${item.id}`}
                            id={item.id}
                            caseId={caseId}
                            description={item.description}
                            timestamp={item.timestamp}
                            submitter={item.submitter}
                            metadataCID={item.metadataCID}
                            isAdmissible={item.isAdmissible}
                            showCaseLink={false}
                            onSetAdmissibility={handleSetAdmissibility}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
