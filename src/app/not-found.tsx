// src/app/not-found.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6 px-4"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10"
                >
                    <AlertCircle className="w-12 h-12 text-destructive" />
                </motion.div>

                <h1 className="text-6xl font-bold text-foreground">404</h1>
                <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
                <p className="text-muted-foreground max-w-md">
                    Desculpe, a página que você está procurando não existe ou foi movida.
                </p>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                    >
                        <Home className="w-4 h-4" />
                        Voltar para o Dashboard
                    </Link>
                </motion.div>

                <p className="text-xs text-muted-foreground mt-8">
                    {new Date().getFullYear()} © OngSys Dashboard
                </p>
            </motion.div>
        </div>
    );
}