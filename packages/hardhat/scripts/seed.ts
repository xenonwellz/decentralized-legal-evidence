import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import hre from "hardhat";
import legalEvidenceJson from "../artifacts/contracts/LegalEvidence.sol/LegalEvidence.json";

// Sample data to seed the contract with
const seedData = [
  {
    name: "Smith v. Johnson",
    description: "Contract dispute involving property damage claims",
    evidence: [
      {
        metadataCID: "QmZ9Qx2JnvdJsS5UzJjo1hYrLbEMX5WELjBPdafFWz6rUi",
        description: "Contract document signed by both parties",
      },
      {
        metadataCID: "QmXJ92ip59f7uR9GxV9AbWgS8cK2SiJyavsVV7CWKVXQeM",
        description: "Photos of property damage",
      },
    ],
  },
  {
    name: "State v. Williams",
    description: "Criminal case involving digital evidence",
    evidence: [
      {
        metadataCID: "QmV1XvxpT3G7GhYEU5S8Cw3x7QJR8nLuDLmGnMZkh9xJKV",
        description: "Digital forensics report",
      },
      {
        metadataCID: "QmYXcHyBbUJKts5PVN8NMX5bvQQBKa9ybCNKFMpWVVyg2y",
        description: "Video footage from security camera",
      },
      {
        metadataCID: "QmZXcj5vvY9RkKjGCwKwDb5UM5EAQrdSCJk2v9zSiZPj1h",
        description: "Interview transcript",
      },
    ],
  },
  {
    name: "Rodriguez Family Trust",
    description: "Estate planning and trust documentation",
    evidence: [
      {
        metadataCID: "QmTVLVmNPYdaK8UbGvnafBYpzRVvQ4JzFUVvYeJSwWZM4T",
        description: "Trust establishment document",
      },
      {
        metadataCID: "QmPhSHLTZnfQjx2XhtqUYeKUnzpFZHWShwfdgYXnJS6eRf",
        description: "Amendments to trust dated 2023",
      },
    ],
  },
];

async function main() {
  try {
    // Get contract instance at the deployed address
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Set up Viem clients
    const privateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const account = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: hardhat,
      transport: http(),
    });

    console.log("Seeding contract with account:", account.address);

    // Parse ABI
    const abi = legalEvidenceJson.abi;

    // Seed cases and evidence
    for (const caseData of seedData) {
      console.log(`Creating case: ${caseData.name}`);

      // Create the case
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: "createCase",
        args: [caseData.name, caseData.description],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Get case count to determine case ID
      const caseCount = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "caseCount",
      });

      // Case ID is count - 1 since we just added a new case
      const caseId = Number(caseCount) - 1;

      // Submit evidence for this case
      for (const evidenceData of caseData.evidence) {
        console.log(`  - Adding evidence: ${evidenceData.description}`);
        const evidenceHash = await walletClient.writeContract({
          address: contractAddress,
          abi,
          functionName: "submitEvidence",
          args: [
            BigInt(caseId),
            evidenceData.metadataCID,
            evidenceData.description,
          ],
        });

        await publicClient.waitForTransactionReceipt({ hash: evidenceHash });

        // For demo purposes, mark some evidence as admissible
        if (Math.random() > 0.3) {
          // 70% chance of being admissible
          console.log(`    - Marking as admissible`);
          // Get the latest evidence ID
          const evidenceCount = await publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: "getEvidenceCount",
            args: [BigInt(caseId)],
          });

          const evidenceId = Number(evidenceCount) - 1;

          const admissibilityHash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            functionName: "setEvidenceAdmissibility",
            args: [BigInt(caseId), BigInt(evidenceId), true],
          });

          await publicClient.waitForTransactionReceipt({
            hash: admissibilityHash,
          });
        }
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
