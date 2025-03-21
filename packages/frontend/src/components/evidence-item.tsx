import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { getIpfsUrl } from "../services/ipfs";
import { ExternalLink, Briefcase } from "lucide-react";

export interface EvidenceItemProps {
    id: number;
    caseId: number;
    caseTitle?: string;
    description: string;
    timestamp: number;
    submitter: string;
    metadataCID: string;
    isAdmissible: boolean;
    showCaseLink?: boolean;
    onSetAdmissibility: (
        caseId: number,
        evidenceId: number,
        isAdmissible: boolean
    ) => Promise<void>;
}

export function EvidenceItem({
    id,
    caseId,
    caseTitle,
    description,
    timestamp,
    submitter,
    metadataCID,
    isAdmissible,
    showCaseLink = true,
    onSetAdmissibility,
}: EvidenceItemProps) {
    // Function to format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    return (
        <div className="bg-white border border-gray-300">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {description}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Submitted on {formatDate(timestamp)}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {showCaseLink && caseTitle && (
                            <Link
                                to={`/cases/${caseId}`}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100"
                            >
                                Case: {caseTitle}
                            </Link>
                        )}
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                isAdmissible
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                            {isAdmissible ? "Admissible" : "Pending Review"}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-300 p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                Submitter
                            </h3>
                            <p className="text-gray-800 break-all font-mono text-sm">
                                {submitter}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                Metadata CID
                            </h3>
                            <a
                                href={getIpfsUrl(metadataCID)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono text-sm"
                            >
                                {metadataCID}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                        <a
                            href={getIpfsUrl(metadataCID)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                        >
                            <ExternalLink className="h-5 w-5 mr-1" />
                            View Evidence
                        </a>
                        {showCaseLink && (
                            <Link
                                to={`/cases/${caseId}`}
                                className="text-gray-600 hover:text-gray-900 flex items-center text-sm font-medium"
                            >
                                <Briefcase className="h-5 w-5 mr-1" />
                                View Case
                            </Link>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() =>
                            onSetAdmissibility(caseId, id, !isAdmissible)
                        }
                        className={
                            isAdmissible
                                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                                : "text-green-600 hover:text-green-800 hover:bg-green-50"
                        }
                    >
                        {isAdmissible
                            ? "Mark as Inadmissible"
                            : "Mark as Admissible"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default EvidenceItem;
