import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { getIpfsUrl } from "../services/ipfs";
import { Briefcase, Eye } from "lucide-react";

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
                <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                    <div className="mb-2 md:mb-0">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                            {description}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Submitted on {formatDate(timestamp)}
                        </p>
                    </div>
                    <div className="flex  items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                Submitter
                            </h3>
                            <p className="text-gray-800 break-all font-mono text-sm">
                                {submitter}
                            </p>
                        </div>
                        <div className="w-full">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                Metadata CID
                            </h3>
                            <a
                                href={getIpfsUrl(metadataCID)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono text-sm w-full"
                            >
                                {metadataCID}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                    <div className="flex space-x-4">
                        <Link
                            to={`/evidence/view/${caseId}/${id}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                        >
                            <Eye className="h-5 w-5 mr-1" />
                            View Details
                        </Link>

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

                    <div>
                        <Button
                            variant="outline"
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
        </div>
    );
}

export default EvidenceItem;
