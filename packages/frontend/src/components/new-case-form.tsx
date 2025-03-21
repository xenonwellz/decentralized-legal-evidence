import { useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { contractService } from "../services/contract";

interface NewCaseFormProps {
    onSuccess: () => void;
}

export default function NewCaseForm({ onSuccess }: NewCaseFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            // Reset form
            setName("");
            setDescription("");

            // Call success callback
            onSuccess();
        } catch (err) {
            console.error("Error creating case:", err);
            setError("Failed to create case. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Create New Case</DialogTitle>
                <DialogDescription>
                    Enter the details for the new legal case.
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {error && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative"
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
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Brief description of the case..."
                        disabled={submitting}
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? "Creating..." : "Create Case"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
