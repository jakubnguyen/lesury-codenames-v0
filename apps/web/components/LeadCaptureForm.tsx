'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LeadCaptureForm() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !email.includes('@')) return;

        setSubmitting(true);

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error('Failed');
        } catch {
            // Silently fail — don't block the user
        }

        setSubmitting(false);
        setSubmitted(true);
    };

    return (
        <div className="bg-card rounded-xl p-5 shadow-sm text-left relative overflow-hidden">
            <AnimatePresence mode="wait">
                {!submitted ? (
                    <motion.form
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit}
                        className="space-y-3"
                    >
                        <div className="mb-2 text-center">
                            <h3 className="font-bold text-lg text-foreground mb-1">
                                Host Your Own Game
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Enter your email below to get free access to host Lesury games for your friends.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={submitting}
                                required
                                className="flex-1 bg-secondary border-border focus-visible:ring-accent rounded-lg"
                            />
                            <ShadcnButton
                                type="submit"
                                disabled={submitting || !email}
                                className="whitespace-nowrap rounded-lg"
                            >
                                {submitting ? '...' : 'Get Access'}
                            </ShadcnButton>
                        </div>
                    </motion.form>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-3"
                    >
                        <div className="text-3xl mb-2">🎯</div>
                        <h3 className="font-bold text-foreground mb-1">
                            You're on the list!
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            We've sent access instructions to {email}.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

