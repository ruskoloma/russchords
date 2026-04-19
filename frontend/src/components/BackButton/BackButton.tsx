import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

interface BackButtonProps {
    label?: string;
    variant?: string;
    size?: string;
    className?: string;
}

/**
 * Back button that prefers the explicit `?source=` URL param (set by
 * `createNavigationUrl`) and falls back to the browser history.
 *
 * Used to live in tandem with a `SourceContext` that remembered the last
 * song-page source across navigations. That context was redundant — the
 * source travels with the URL, and `navigate(-1)` is a safe fallback for
 * any case where the param wasn't threaded through.
 */
export function BackButton({
    label = 'Back',
    variant = '',
    size = 'sm',
    className
}: BackButtonProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const source = searchParams.get('source');

    const handleBack = () => {
        if (source) {
            navigate(source);
        } else {
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
