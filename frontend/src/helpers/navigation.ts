export function createSourceUrl(currentLocation: { pathname: string; search: string }): string {
    return `${currentLocation.pathname}${currentLocation.search}`;
}

export function createNavigationUrl(targetPath: string, currentLocation: { pathname: string; search: string }): string {
    const source = createSourceUrl(currentLocation);
    return `${targetPath}?source=${encodeURIComponent(source)}`;
}
