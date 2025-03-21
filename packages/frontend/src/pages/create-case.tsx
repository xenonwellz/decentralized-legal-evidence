import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { contractService } from "../services/contract";

export default function CreateCasePage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validation
        if (!name.trim() || !description.trim()) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Create the case on the blockchain
            await contractService.createCase(name, description);

            // Navigate to cases page after success
            navigate("/cases");
        } catch (err) {
            console.error("Error creating case:", err);
            setError("Failed to create case. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Create New Case
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Enter the details for your new legal case
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/cases")}>
                    Cancel
                </Button>
            </div>

            <div className="bg-white border-t border-gray-300 pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3"
                            role="alert"
                        >
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Case Name
                        </label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g., Smith v. Johnson"
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="description"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex min-h-[120px] w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Brief description of the case..."
                            disabled={submitting}
                        />
                    </div>

                    <div className="flex mt-6">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full"
                        >
                            {submitting ? "Creating..." : "Create Case"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
