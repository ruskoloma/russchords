import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useSourceContext } from '../../contexts/SourceContext';

interface BackButtonProps {
    label?: string;
    variant?: string;
    size?: string;
    className?: string;
}

export function BackButton({
    label = 'Back',
    variant = '',
    size = 'sm',
    className
}: BackButtonProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { lastSongPageSource } = useSourceContext();

    const source = searchParams.get('source');

    const handleBack = () => {
        if (source) {
            // Use the source from URL parameters first
            navigate(source);
        } else if (lastSongPageSource) {
            // Fall back to the last song page source from context
            navigate(lastSongPageSource);
        } else {
            // Final fallback - go back in browser history
            navigate(-1);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
            className={className}
        >
            {label}
        </Button>
    );
}
