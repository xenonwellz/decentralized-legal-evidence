# LegalChain - Blockchain-Based Evidence Management System

LegalChain is a decentralized application for managing legal evidence on the blockchain. It allows legal professionals to store, track, and validate evidence with immutable records.

## Features

- **Case Management**: Create and manage legal cases
- **Evidence Tracking**: Upload evidence files to IPFS and link them to cases
- **Evidence Admissibility**: Mark evidence as admissible or pending review
- **Blockchain Security**: All records are stored immutably on the blockchain
- **Decentralized Storage**: Evidence files are stored on IPFS (InterPlanetary File System)

## UI Enhancements

The user interface has been designed with a focus on:

- **Clean, Modern Design**: Using Tailwind CSS for a professional look and feel
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Simple sidebar navigation with clear labeling
- **Organized Case Management**: Grid layout for cases with clear visual hierarchy
- **Detailed Case Views**: Comprehensive case detail page with evidence listing
- **Evidence Management**: Tabbed interface for filtering evidence by status
- **Loading States**: Visual feedback during data loading operations
- **Error Handling**: Clear error messages when operations fail

## Project Structure

The project is structured as a monorepo with the following packages:

- `packages/frontend`: React frontend application
- `packages/hardhat`: Blockchain smart contracts

### Frontend Structure

- **Pages**: Key application views (Dashboard, Cases, Evidence, Case Detail)
- **Components**: Reusable UI components 
- **Services**: API and blockchain interaction services
- **UI Components**: Shadcn UI-inspired component library

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Viem
- **Blockchain**: Ethereum, Solidity, Hardhat
- **Storage**: IPFS via NFT.Storage
- **Build Tools**: Vite, PNPM

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Start the Hardhat development environment:
   ```
   pnpm run dev:hardhat
   ```
4. Deploy the smart contracts:
   ```
   pnpm run deploy:hardhat
   ```
5. Start the frontend application:
   ```
   pnpm run dev:frontend
   ```
6. Navigate to http://localhost:5174/ in your browser

## How to Use the Application

1. **Dashboard**: The main interface displays an overview of your cases and evidence
2. **Cases Management**: 
   - Create new legal cases with relevant details
   - View and manage existing cases
   - Track case status and updates
3. **Evidence Management**:
   - Upload evidence files which will be stored on IPFS
   - Link evidence to specific cases
   - Mark evidence as admissible or keep them pending review
   - View chain of custody and verification information
4. **Blockchain Verification**:
   - All actions are recorded on the blockchain
   - Evidence files receive a unique hash for verification
   - Changes to evidence status are timestamped and immutable

## Development

To run the development environment:

```bash
# Install all dependencies
pnpm install

# Start the local blockchain
pnpm run dev:hardhat

# Deploy smart contracts to the local blockchain
pnpm run deploy:hardhat

# Start the frontend
pnpm run dev:frontend
```

Navigate to http://localhost:5174/ to access the application.

## License

MIT 