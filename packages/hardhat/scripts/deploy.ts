import hre from "hardhat";

import LegalEvidenceModule from "../ignition/modules/LegalEvidence";

async function main() {
  const { legalEvidence } = await hre.ignition.deploy(LegalEvidenceModule);

  console.log(`LegalEvidence deployed to: ${legalEvidence.address}`);
}

main().catch(console.error);
