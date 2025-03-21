import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import LegalEvidenceArtifact from "@/artifacts/contracts/LegalEvidence.sol/LegalEvidence.json";

const abi = LegalEvidenceArtifact.abi;

// Contract and network configuration
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
console.log(contractAddress);
const privateKey =
    import.meta.env.PRIVATE_KEY ??
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const rpcUrl = import.meta.env.VITE_RPC_URL ?? "http://127.0.0.1:8545";

// Account setup
const account = privateKeyToAccount(privateKey as `0x${string}`);

// Client setup
export const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(rpcUrl),
});

export const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http(rpcUrl),
});

// Type definitions
export interface Case {
    id: number;
    name: string;
    description: string;
    owner: string;
    createdAt: number;
    isActive: boolean;
    evidenceCount?: number;
    title?: string;
    timestamp?: number;
}

export interface Evidence {
    id: number;
    metadataCID: string;
    description: string;
    submitter: string;
    timestamp: number;
    isAdmissible: boolean;
}

// Contract service functions
export const contractService = {
    // Get the current account address
    getAccount: () => account.address,

    // Get total number of cases
    getCaseCount: async (): Promise<number> => {
        const count = await publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: "caseCount",
        });
        return Number(count);
    },

    // Get all cases
    getAllCases: async (): Promise<Case[]> => {
        const count = await contractService.getCaseCount();
        const cases: Case[] = [];

        for (let i = 0; i < count; i++) {
            const caseData = await contractService.getCase(i);
            cases.push(caseData);
        }

        return cases;
    },

    // Get a specific case by ID
    getCase: async (caseId: number): Promise<Case> => {
        const res = await publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: "getCase",
            args: [BigInt(caseId)],
        });

        const result = res as Case;

        return {
            id: caseId,
            name: result.name,
            description: result.description,
            owner: result.owner,
            createdAt: Number(result.createdAt),
            isActive: result.isActive,
            title: result.name, // Map name to title for UI consistency
            timestamp: Number(result.createdAt), // Map createdAt to timestamp for UI consistency
        };
    },

    // Create a new case
    createCase: async (title: string, description: string): Promise<string> => {
        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            functionName: "createCase",
            args: [title, description],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
    },

    // Set case status (active/inactive)
    setCaseStatus: async (
        caseId: number,
        isActive: boolean
    ): Promise<string> => {
        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            functionName: "setCaseStatus",
            args: [BigInt(caseId), isActive],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
    },

    // Get evidence count for a case
    getEvidenceCount: async (caseId: number): Promise<number> => {
        const count = await publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: "getEvidenceCount",
            args: [BigInt(caseId)],
        });

        return Number(count);
    },

    // Get all evidence for a case
    getEvidenceForCase: async (caseId: number): Promise<Evidence[]> => {
        const count = await contractService.getEvidenceCount(caseId);
        const evidence: Evidence[] = [];

        for (let i = 0; i < count; i++) {
            const evidenceData = await contractService.getEvidence(caseId, i);
            evidence.push(evidenceData);
        }

        return evidence;
    },

    // Get specific evidence
    getEvidence: async (
        caseId: number,
        evidenceId: number
    ): Promise<Evidence> => {
        const res = await publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: "getEvidence",
            args: [BigInt(caseId), BigInt(evidenceId)],
        });

        const result = res as Evidence;

        return {
            id: evidenceId,
            metadataCID: result.metadataCID,
            description: result.description,
            submitter: result.submitter,
            timestamp: Number(result.timestamp),
            isAdmissible: result.isAdmissible,
        };

        throw new Error("Invalid evidence data returned from contract");
    },

    // Add new evidence
    addEvidence: async (
        caseId: number,
        description: string,
        metadataCID: string
    ): Promise<string> => {
        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            functionName: "submitEvidence",
            args: [BigInt(caseId), metadataCID, description],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
    },

    // Set evidence admissibility
    setEvidenceAdmissibility: async (
        caseId: number,
        evidenceId: number,
        isAdmissible: boolean
    ): Promise<string> => {
        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            functionName: "setEvidenceAdmissibility",
            args: [BigInt(caseId), BigInt(evidenceId), isAdmissible],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
    },
};

export default contractService;
