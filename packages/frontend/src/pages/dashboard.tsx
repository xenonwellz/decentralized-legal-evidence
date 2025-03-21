import { useState, useEffect, JSX } from "react";
import { contractService } from "../services/contract";
import { Link } from "react-router-dom";
import {
    Briefcase,
    FileText,
    Clock,
    CheckCircle,
    SquareArrowOutUpRight,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentCase {
    id: number;
    title: string;
    description: string;
    timestamp: number;
    evidenceCount: number;
}

// StatsCard Component
interface StatsCardProps {
    title: string;
    value: number;
    icon: JSX.Element;
    color: string;
    link?: string;
    linkText?: string;
    extraText?: string;
}

function StatsCard({
    title,
    value,
    icon,
    color,
    link,
    linkText,
    extraText,
}: StatsCardProps) {
    return (
        <div className="bg-white border border-gray-300 rounded">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-300 rounded">
                <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                <div
                    className={`h-10 w-10 bg-${color}-100 flex items-center justify-center rounded-full`}
                >
                    {icon}
                </div>
            </div>
            <div className="p-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">{value}</h2>
                <Button variant="outline" className="p-3">
                    {link && linkText ? (
                        <Link to={link} className={`text-${color}-600`}>
                            {linkText}
                        </Link>
                    ) : extraText ? (
                        <span className={`text-${color}-600`}>{extraText}</span>
                    ) : null}
                </Button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalCases: 0,
        totalEvidence: 0,
        pendingEvidence: 0,
        admissibleEvidence: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentCases, setRecentCases] = useState<RecentCase[]>([]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);

                // Get case count
                const caseCount = await contractService.getCaseCount();
                let totalEvidence = 0;
                let pendingEvidence = 0;
                let admissibleEvidence = 0;
                const recentCasesData: RecentCase[] = [];

                // Get evidence for the most recent 3 cases
                for (
                    let i = caseCount - 1;
                    i >= Math.max(0, caseCount - 3);
                    i--
                ) {
                    const caseData = await contractService.getCase(i);
                    const evidenceList =
                        await contractService.getEvidenceForCase(i);

                    // Add to stats
                    totalEvidence += evidenceList.length;

                    evidenceList.forEach((ev) => {
                        if (ev.isAdmissible) {
                            admissibleEvidence++;
                        } else {
                            pendingEvidence++;
                        }
                    });

                    // Add to recent cases
                    recentCasesData.push({
                        id: i,
                        title: caseData.title || "Untitled Case",
                        description: caseData.description || "",
                        timestamp: caseData.timestamp || 0,
                        evidenceCount: evidenceList.length,
                    });
                }

                setStats({
                    totalCases: caseCount,
                    totalEvidence,
                    pendingEvidence,
                    admissibleEvidence,
                });

                setRecentCases(recentCasesData);
                setLoading(false);
            } catch (err) {
                console.error("Error loading dashboard data:", err);
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    // Function to format the date
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
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    // Stats card data
    const statsCards = [
        {
            title: "Total Cases",
            value: stats.totalCases,
            color: "blue",
            link: "/cases",
            linkText: "View all cases",
            icon: <Briefcase className="h-5 w-5 text-blue-600" />,
        },
        {
            title: "Total Evidence",
            value: stats.totalEvidence,
            color: "purple",
            link: "/evidence",
            linkText: "View all evidence",
            icon: <FileText className="h-5 w-5 text-purple-600" />,
        },
        {
            title: "Pending Review",
            value: stats.pendingEvidence,
            color: "yellow",
            extraText: "Awaiting review",
            icon: <Clock className="h-5 w-5 text-yellow-600" />,
        },
        {
            title: "Admissible Evidence",
            value: stats.admissibleEvidence,
            color: "green",
            extraText: "Approved evidence",
            icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        },
    ];

    return (
        <div>
            <div className="mb-12">
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Overview of your legal evidence management system
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((card, index) => (
                    <StatsCard
                        key={index}
                        title={card.title}
                        value={card.value}
                        color={card.color}
                        icon={card.icon}
                        link={card.link}
                        linkText={card.linkText}
                        extraText={card.extraText}
                    />
                ))}
            </div>

            {/* Recent Cases */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Recent Cases
                    </h2>
                    <Link
                        to="/cases"
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                    >
                        View <SquareArrowOutUpRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="bg-white border border-gray-300 rounded">
                    {recentCases.length > 0 ? (
                        <div className="divide-y divide-gray-300">
                            {recentCases.map((caseItem) => (
                                <div
                                    key={caseItem.id}
                                    className="p-5 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-lg text-gray-900">
                                                <Link
                                                    to={`/cases/${caseItem.id}`}
                                                    className="hover:text-blue-600"
                                                >
                                                    {caseItem.title}
                                                </Link>
                                            </h3>
                                            <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">
                                                {caseItem.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="text-right text-sm">
                                                <span className="text-gray-700">
                                                    Created
                                                </span>
                                                <div className="text-gray-500">
                                                    {formatDate(
                                                        caseItem.timestamp
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-700">
                                                {caseItem.evidenceCount}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-300 p-8 text-center">
                            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-700 mb-2">
                                No cases found
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                Create your first legal case to start collecting
                                and managing evidence on the blockchain.
                            </p>
                            <Link to="/cases/create">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Case
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            to: "/cases",
                            bgColor: "bg-blue-100",
                            icon: (
                                <Briefcase className="h-6 w-6 text-blue-600" />
                            ),
                            title: "Create New Case",
                            description: "Start a new legal case",
                        },
                        {
                            to: "/evidence",
                            bgColor: "bg-purple-100",
                            icon: (
                                <FileText className="h-6 w-6 text-purple-600" />
                            ),
                            title: "Submit Evidence",
                            description: "Add new evidence to a case",
                        },
                        {
                            to: "/evidence",
                            bgColor: "bg-green-100",
                            icon: (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            ),
                            title: "Review Evidence",
                            description: "Manage pending evidence items",
                        },
                    ].map((action, index) => (
                        <Link
                            key={index}
                            to={action.to}
                            className="flex flex-col items-center justify-center border border-gray-300 p-6 transition-shadow"
                        >
                            <div
                                className={`h-12 w-12 rounded-full ${action.bgColor} flex items-center justify-center mb-3`}
                            >
                                {action.icon}
                            </div>
                            <h3 className="font-medium text-gray-800">
                                {action.title}
                            </h3>
                            <p className="text-sm text-gray-500 text-center mt-1">
                                {action.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
