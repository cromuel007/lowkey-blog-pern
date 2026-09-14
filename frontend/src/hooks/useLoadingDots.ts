import { useEffect, useState } from "react";

export function useLoadingDots() {
    const [loadingDots, setLoadingDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingDots((dots) =>
                dots.length === 3 ? "" : dots + "."
            );
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return loadingDots;
}