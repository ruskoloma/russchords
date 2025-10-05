import { createContext, useContext, useState, type ReactNode } from 'react';

interface SourceContextType {
    lastSongPageSource: string | null;
    setLastSongPageSource: (source: string | null) => void;
}

const SourceContext = createContext<SourceContextType | undefined>(undefined);

export function SourceProvider({ children }: { children: ReactNode }) {
    const [lastSongPageSource, setLastSongPageSource] = useState<string | null>(null);

    return (
        <SourceContext.Provider value={{ lastSongPageSource, setLastSongPageSource }}>
            {children}
        </SourceContext.Provider>
    );
}

export function useSourceContext() {
    const context = useContext(SourceContext);
    if (context === undefined) {
        throw new Error('useSourceContext must be used within a SourceProvider');
    }
    return context;
}

