import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { contractService, contractAddress } from "../../services/contract";
import { Wallet, AlertTriangle } from "lucide-react";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [accountAddress, setAccountAddress] = useState<string>("");
    const [isWrongChain, setIsWrongChain] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    // Check chain and wallet on load
    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Try to auto-connect wallet first
                const address = await contractService.connectWallet();
                setAccountAddress(address || "");

                // If connected, check if on the right chain
                if (address) {
                    try {
                        const isCorrectChain =
                            await contractService.ensureCorrectChain();
                        setIsWrongChain(!isCorrectChain);
                    } catch (error) {
                        console.error("Chain check failed:", error);
                        setIsWrongChain(true);
                    }
                }
            } catch (error) {
                // Fall back to just checking if already connected
                console.error("Auto wallet connection failed:", error);
                const address = contractService.getAccount();
                setAccountAddress(address || "");
            }
        };

        checkConnection();
    }, []);

    // Handle wallet connection
    const handleConnectWallet = async () => {
        setIsConnecting(true);
        try {
            const address = await contractService.connectWallet();
            setAccountAddress(address || "");

            // Check if on correct chain after connection
            if (address) {
                const isCorrectChain =
                    await contractService.ensureCorrectChain();
                setIsWrongChain(!isCorrectChain);
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle chain switching
    const handleSwitchChain = async () => {
        try {
            const isCorrectChain = await contractService.ensureCorrectChain();
            setIsWrongChain(!isCorrectChain);
        } catch (error) {
            console.error("Failed to switch chain:", error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top navigation bar */}
            <div className="bg-white border-b border-gray-300 h-20 flex flex-col justify-center sticky top-0 z-10">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Left side with logo and mobile menu button */}
                        <div className="flex items-center">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2"
                                >
                                    <img
                                        src="/logo.png"
                                        alt="LegalChain"
                                        className="h-8 w-8"
                                    />
                                    <span className="text-lg font-bold text-blue-800">
                                        Legal
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Right side with wallet connection */}
                        <div className="flex items-center gap-2">
                            {isWrongChain && accountAddress && (
                                <button
                                    onClick={handleSwitchChain}
                                    className="flex items-center px-3 py-1.5 text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium">
                                        Switch Network
                                    </span>
                                </button>
                            )}

                            {accountAddress ? (
                                <div className="flex items-center px-3 py-1.5 text-gray-700 border border-gray-300 rounded">
                                    <Wallet className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium">
                                        {accountAddress.substring(0, 6)}...
                                        {accountAddress.substring(38)}
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectWallet}
                                    disabled={isConnecting}
                                    className="flex items-center px-3 py-1.5 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium">
                                        {isConnecting
                                            ? "Connecting..."
                                            : "Connect Wallet"}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Main content */}
                <main className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-300">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="mb-4 md:mb-0">
                                <p className="text-gray-400 text-sm">
                                    Blockchain-powered evidence management
                                </p>
                            </div>
                            <div className="text-gray-400 text-sm text-center md:text-right">
                                <p>Contract address: {contractAddress}</p>
                                <p className="mt-1">
                                    © 2023 LegalChain. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
