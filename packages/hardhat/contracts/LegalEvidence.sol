// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LegalEvidence
 * @dev Smart contract for managing legal evidence stored on IPFS
 */
contract LegalEvidence {
    // Struct to store case information
    struct Case {
        string name;
        string description;
        address owner;
        uint256 createdAt;
        bool isActive;
    }

    // Struct to store evidence information
    struct Evidence {
        string metadataCID; // CID of the JSON metadata (containing all file CIDs)
        string description;
        address submitter;
        uint256 timestamp;
        bool isAdmissible;
    }

    // Mapping from case ID to Case
    mapping(uint256 => Case) public cases;
    
    // Mapping from case ID to evidence array
    mapping(uint256 => Evidence[]) public evidenceRegistry;
    
    // Total number of cases
    uint256 public caseCount;

    // Events
    event CaseCreated(uint256 indexed caseId, string name, address owner);
    event EvidenceSubmitted(uint256 indexed caseId, uint256 evidenceId, string metadataCID, address submitter);
    event EvidenceAdmissibilityChanged(uint256 indexed caseId, uint256 evidenceId, bool isAdmissible);
    event CaseStatusChanged(uint256 indexed caseId, bool isActive);

    /**
     * @dev Create a new legal case
     * @param _name Case name
     * @param _description Case description
     */
    function createCase(string memory _name, string memory _description) public {
        uint256 caseId = caseCount;
        cases[caseId] = Case({
            name: _name,
            description: _description,
            owner: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        caseCount++;
        
        emit CaseCreated(caseId, _name, msg.sender);
    }

    /**
     * @dev Submit evidence to a case
     * @param _caseId Case ID
     * @param _metadataCID IPFS CID of the JSON metadata containing all file CIDs
     * @param _description Description of the evidence
     */
    function submitEvidence(uint256 _caseId, string memory _metadataCID, string memory _description) public {
        require(_caseId < caseCount, "Case does not exist");
        require(cases[_caseId].isActive, "Case is not active");
        
        Evidence memory newEvidence = Evidence({
            metadataCID: _metadataCID,
            description: _description,
            submitter: msg.sender,
            timestamp: block.timestamp,
            isAdmissible: false // Initially set to false until reviewed
        });
        
        evidenceRegistry[_caseId].push(newEvidence);
        uint256 evidenceId = evidenceRegistry[_caseId].length - 1;
        
        emit EvidenceSubmitted(_caseId, evidenceId, _metadataCID, msg.sender);
    }

    /**
     * @dev Change the admissibility status of evidence
     * @param _caseId Case ID
     * @param _evidenceId Evidence ID
     * @param _isAdmissible New admissibility status
     */
    function setEvidenceAdmissibility(uint256 _caseId, uint256 _evidenceId, bool _isAdmissible) public {
        require(_caseId < caseCount, "Case does not exist");
        require(cases[_caseId].owner == msg.sender, "Only case owner can change admissibility");
        require(_evidenceId < evidenceRegistry[_caseId].length, "Evidence does not exist");
        
        evidenceRegistry[_caseId][_evidenceId].isAdmissible = _isAdmissible;
        
        emit EvidenceAdmissibilityChanged(_caseId, _evidenceId, _isAdmissible);
    }

    /**
     * @dev Change the active status of a case
     * @param _caseId Case ID
     * @param _isActive New active status
     */
    function setCaseStatus(uint256 _caseId, bool _isActive) public {
        require(_caseId < caseCount, "Case does not exist");
        require(cases[_caseId].owner == msg.sender, "Only case owner can change status");
        
        cases[_caseId].isActive = _isActive;
        
        emit CaseStatusChanged(_caseId, _isActive);
    }

    /**
     * @dev Get case details
     * @param _caseId Case ID
     * @return Case details
     */
    function getCase(uint256 _caseId) public view returns (Case memory) {
        require(_caseId < caseCount, "Case does not exist");
        return cases[_caseId];
    }

    /**
     * @dev Get the count of evidence items for a case
     * @param _caseId Case ID
     * @return Number of evidence items
     */
    function getEvidenceCount(uint256 _caseId) public view returns (uint256) {
        require(_caseId < caseCount, "Case does not exist");
        return evidenceRegistry[_caseId].length;
    }

    /**
     * @dev Get evidence details
     * @param _caseId Case ID
     * @param _evidenceId Evidence ID
     * @return Evidence details
     */
    function getEvidence(uint256 _caseId, uint256 _evidenceId) public view returns (Evidence memory) {
        require(_caseId < caseCount, "Case does not exist");
        require(_evidenceId < evidenceRegistry[_caseId].length, "Evidence does not exist");
        return evidenceRegistry[_caseId][_evidenceId];
    }
} 