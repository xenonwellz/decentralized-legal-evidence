import {
    createPublicClient,
    createWalletClient,
    http,
    custom,
    Chain,
} from "viem";
import { hardhat } from "viem/chains";
import LegalEvidenceArtifact from "@/artifacts/contracts/LegalEvidence.sol/LegalEvidence.json";
import DeployedAddresses from "@/artifacts/deployed_addresses.json";

const abi = LegalEvidenceArtifact.abi;

// Contract and network configuration
export const contractAddress = DeployedAddresses[
    "LegalEvidenceModule#LegalEvidence"
] as `0x${string}`;

const rpcUrl = import.meta.env.VITE_RPC_URL ?? "http://127.0.0.1:8545";

// Define deployment chain - use hardhat as default
const deploymentChain: Chain = hardhat;

// Client setup
export const publicClient = createPublicClient({
    chain: deploymentChain,
    transport: http(rpcUrl),
});

// Use a wallet connection instead of a private key
// This will be initialized when connectWallet is called
let walletClient: ReturnType<typeof createWalletClient> | null = null;
let connectedAccount: string | null = null;

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
    // Check if wallet is connected
    isWalletConnected: () => !!connectedAccount,

    // Check if on the right chain and switch if needed
    ensureCorrectChain: async (): Promise<boolean> => {
        if (!walletClient) {
            throw new Error("Wallet not connected");
        }

        try {
            // Get the current chain ID from the wallet using window.ethereum
            const currentChainIdHex = await window.ethereum?.request({
                method: "eth_chainId",
            });
            const currentChainId = currentChainIdHex
                ? parseInt(currentChainIdHex as string, 16)
                : 0;

            // Check if it matches the deployment chain
            if (currentChainId !== deploymentChain.id) {
                try {
                    // Try to switch to the correct chain
                    await window.ethereum?.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                            { chainId: `0x${deploymentChain.id.toString(16)}` },
                        ],
                    });
                    return true;
                } catch (error: unknown) {
                    // If the chain doesn't exist in the wallet, try to add it
                    const switchError = error as { code?: number };
                    if (switchError.code === 4902) {
                        await window.ethereum?.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: `0x${deploymentChain.id.toString(
                                        16
                                    )}`,
                                    chainName: deploymentChain.name,
                                    nativeCurrency:
                                        deploymentChain.nativeCurrency,
                                    rpcUrls: [rpcUrl],
                                },
                            ],
                        });
                        // Try switching again
                        await window.ethereum?.request({
                            method: "wallet_switchEthereumChain",
                            params: [
                                {
                                    chainId: `0x${deploymentChain.id.toString(
                                        16
                                    )}`,
                                },
                            ],
                        });
                        return true;
                    }
                    throw error;
                }
            }
            return true;
        } catch (error) {
            console.error("Failed to ensure correct chain:", error);
            return false;
        }
    },

    // Connect to wallet
    connectWallet: async (): Promise<string | null> => {
        try {
            // Check if window.ethereum exists
            if (!window?.ethereum) {
                alert("Please install MetaMask or another Ethereum wallet");
                return null;
            }

            // Create a wallet client with the browser provider
            walletClient = createWalletClient({
                chain: deploymentChain,
                transport: custom(window.ethereum),
            });

            // Request accounts
            const [address] = await walletClient.requestAddresses();
            connectedAccount = address;

            // Ensure correct chain
            await contractService.ensureCorrectChain();

            return address;
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            return null;
        }
    },

    // Get the current account address
    getAccount: () => connectedAccount,

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

        const result = res as unknown as Case;

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
        if (!walletClient || !connectedAccount) {
            throw new Error("Wallet not connected");
        }

        // Ensure correct chain
        const correctChain = await contractService.ensureCorrectChain();
        if (!correctChain) {
            throw new Error("Failed to switch to the correct chain");
        }

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            chain: deploymentChain,
            functionName: "createCase",
            args: [title, description],
            account: connectedAccount,
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
    },

    // Set case status (active/inactive)
    setCaseStatus: async (
        caseId: number,
        isActive: boolean
    ): Promise<string> => {
        if (!walletClient || !connectedAccount) {
            throw new Error("Wallet not connected");
        }

        // Ensure correct chain
        await contractService.ensureCorrectChain();

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            chain: deploymentChain,
            functionName: "setCaseStatus",
            args: [BigInt(caseId), isActive],
            account: connectedAccount,
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

        const result = res as unknown as Evidence;

        return {
            id: evidenceId,
            metadataCID: result.metadataCID,
            description: result.description,
            submitter: result.submitter,
            timestamp: Number(result.timestamp),
            isAdmissible: result.isAdmissible,
        };
    },

    // Add new evidence
    addEvidence: async (
        caseId: number,
        description: string,
        metadataCID: string
    ): Promise<string> => {
        if (!walletClient || !connectedAccount) {
            throw new Error("Wallet not connected");
        }

        // Ensure correct chain
        await contractService.ensureCorrectChain();

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            chain: deploymentChain,
            functionName: "submitEvidence",
            args: [BigInt(caseId), metadataCID, description],
            account: connectedAccount,
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
        if (!walletClient || !connectedAccount) {
            throw new Error("Wallet not connected");
        }

        // Ensure correct chain
        await contractService.ensureCorrectChain();

        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            chain: deploymentChain,
            functionName: "setEvidenceAdmissibility",
            args: [BigInt(caseId), BigInt(evidenceId), isAdmissible],
            account: connectedAccount,
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
    },
};

export default contractService;
