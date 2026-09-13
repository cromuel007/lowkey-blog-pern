const assets = import.meta.glob(
    "../assets/**/*.{png,gif,jpg,jpeg,svg}",
    {
        eager: true,
        import: "default",
    },
);

export function getAsset(path: string) {
    return assets[`../assets/${path}`] as string;
}
