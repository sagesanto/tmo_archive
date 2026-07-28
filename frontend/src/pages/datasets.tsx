import { useEffect } from 'react';
import { DatasetDisplay } from '@components/datasets';

export default function Datasets() {
    useEffect(() => {
        document.title = "Datasets";
    }, []);

    return (
        <DatasetDisplay title="Datasets" />
    );
}
