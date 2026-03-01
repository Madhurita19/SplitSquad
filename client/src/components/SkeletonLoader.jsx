export const DashboardSkeleton = () => {
    return (
        <div className="font-body min-h-screen p-4 pb-32 animate-pulse bg-background-light dark:bg-background-dark">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header Skeleton */}
                <header className="bg-gray-300 dark:bg-gray-800 brutalist-border shadow-neo-4 p-4 flex items-center justify-between mt-2 h-24">
                    <div className="flex items-center gap-3 w-full">
                        <div className="size-12 brutalist-border bg-gray-400 dark:bg-gray-700 flex-shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-6 bg-gray-400 dark:bg-gray-700 w-1/2 brutalist-border"></div>
                            <div className="h-4 bg-gray-400 dark:bg-gray-700 w-1/4 brutalist-border"></div>
                        </div>
                    </div>
                </header>

                {/* Summary Section Skeleton */}
                <section className="relative">
                    <div className="bg-white dark:bg-gray-800 brutalist-border shadow-neo-8 p-6 flex flex-col items-start gap-4">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/3 brutalist-border"></div>
                        <div className="h-16 bg-gray-300 dark:bg-gray-700 w-3/4 brutalist-border my-2"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 w-1/2 brutalist-border"></div>
                        <div className="h-14 bg-gray-300 dark:bg-gray-700 w-full brutalist-border mt-2"></div>
                    </div>
                </section>

                {/* Groups List Skeleton */}
                <section className="space-y-4">
                    <div className="flex justify-between items-end mb-2">
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 w-1/3 brutalist-border"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/4 brutalist-border"></div>
                    </div>

                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 brutalist-border p-4 shadow-neo-4 flex justify-between items-center h-24">
                            <div className="space-y-3 w-1/2">
                                <div className="h-6 bg-gray-300 dark:bg-gray-700 w-full brutalist-border"></div>
                                <div className="h-4 bg-gray-300 dark:bg-gray-700 w-3/4 brutalist-border"></div>
                            </div>
                            <div className="h-10 bg-gray-300 dark:bg-gray-700 w-1/4 brutalist-border"></div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

export const GroupDetailSkeleton = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen pb-24 flex flex-col animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center bg-gray-300 dark:bg-gray-800 p-4 border-b-4 border-black justify-between sticky top-0 z-50 h-[76px]">
                <div className="size-10 bg-gray-400 dark:bg-gray-700 border-3 border-black"></div>
                <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-32 bg-gray-400 dark:bg-gray-700"></div>
                    <div className="h-4 w-16 bg-gray-400 dark:bg-gray-700"></div>
                </div>
                <div className="size-10 bg-gray-400 dark:bg-gray-700 border-3 border-black"></div>
            </div>

            {/* Actions Bar Skeleton */}
            <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black bg-white dark:bg-gray-800 h-[52px]">
                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 border-2 border-black"></div>
                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 border-2 border-black"></div>
                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 border-2 border-black ml-auto"></div>
            </div>

            {/* Content Area Skeleton */}
            <div className="flex-1 p-4 space-y-4">
                {/* Search/Filter Bar */}
                <div className="flex gap-2">
                    <div className="h-12 flex-1 bg-gray-300 dark:bg-gray-800 border-2 border-black"></div>
                    <div className="h-12 w-12 bg-gray-300 dark:bg-gray-800 border-2 border-black"></div>
                </div>

                {/* Cards */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-800 border-2 border-black p-4 h-24 shadow-neo-4 flex justify-between items-center">
                        <div className="flex items-center gap-4 w-1/2">
                            <div className="size-12 bg-gray-300 dark:bg-gray-700 border-2 border-black"></div>
                            <div className="space-y-2 w-full">
                                <div className="h-5 w-full bg-gray-300 dark:bg-gray-700"></div>
                                <div className="h-3 w-2/3 bg-gray-300 dark:bg-gray-700"></div>
                            </div>
                        </div>
                        <div className="h-10 w-20 bg-gray-300 dark:bg-gray-700 border-2 border-black"></div>
                    </div>
                ))}
            </div>

            {/* Bottom Nav Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 flex border-t-4 border-black bg-white dark:bg-gray-800 px-4 pb-6 pt-2 gap-2 z-50">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 h-14 bg-gray-300 dark:bg-gray-700 border-2 border-black"></div>
                ))}
            </div>
        </div>
    );
};
