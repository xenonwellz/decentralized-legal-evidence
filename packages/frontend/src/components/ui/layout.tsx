import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { contractService } from "../../services/contract";
import { Wallet } from "lucide-react";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [accountAddress, setAccountAddress] = useState<string>("");

    useEffect(() => {
        // Get the connected account address
        const address = contractService.getAccount();
        setAccountAddress(address);
    }, []);

    return (
        <div className="min-h-screen">
            {/* Top navigation bar */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Left side with logo and mobile menu button */}
                        <div className="flex items-center">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/">
                                    <span className="text-2xl font-bold text-blue-800">
                                        LegalChain
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Right side with wallet connection */}
                        <div className="flex items-center">
                            <div className="flex items-center px-3 py-1.5 text-gray-700 border border-gray-300 rounded">
                                <Wallet className="w-4 h-4 mr-2" />
                                {accountAddress ? (
                                    <span className="text-sm font-medium">
                                        {accountAddress.substring(0, 6)}...
                                        {accountAddress.substring(38)}
                                    </span>
                                ) : (
                                    <span className="text-sm font-medium">
                                        Not Connected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main>
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
                            <p>
                                Contract address:{" "}
                                {import.meta.env.VITE_CONTRACT_ADDRESS}
                            </p>
                            <p className="mt-1">
                                © 2023 LegalChain. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
