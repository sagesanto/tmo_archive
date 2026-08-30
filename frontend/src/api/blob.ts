import { useQuery } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/blobs";

// lightweight listing shape, cheap enough to fetch for many blobs at once
export type BlobRef = {
    id: number;
    natural_key: string;
    analysis_run_id: number;
    source_table: string;
    image_type: number | null;
    image_index: number | null;
    image_name: string | null;

    width: number;
    height: number;
    size_class: string;

    thumbnail_url: string;
    analysis_run_key: string | null;
}

// full detail for a single blob: dtype + pixel-value stats. only fetch for the blob currently being viewed
export type BlobRefDetail = BlobRef & {
    dtype: string;
    vmin: number | null;
    vmax: number | null;
    percentiles: Record<string, number> | null;
    histogram: { vals: number[]; edges: number[] } | null;
}

export function getBlobs(params: { analysis_key?: string, object_key?: string, source_table?: string }, enabled: boolean = true) {
    return useQuery<BlobRef[], Error>({
        queryKey: ["blobs", params],
        queryFn: async () => {
            const t0 = performance.now();
            const { data } = await axios.get<BlobRef[]>(ENDPOINT, { params });
            console.log(`[getBlobs] list fetch: ${(performance.now() - t0).toFixed(1)}ms (${data.length} records)`);
            return data;
        },
        enabled,
        staleTime: Infinity,
        gcTime: Infinity,
    });
}

export function getBlobByObject(object_key: string) {
    return useQuery<BlobRef, Error>({
        queryKey: ["blobByObject", object_key],
        queryFn: async () => {
            const { data } = await axios.get<BlobRef[]>(ENDPOINT, { params: { object_key } });
            if (data.length === 0) {
                throw new Error("Blob not found");
            }
            return data[0];
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });
}

export function useBlobDetail(natural_key?: string | null) {
    return useQuery<BlobRefDetail, Error>({
        queryKey: ["blobDetail", natural_key],
        queryFn: async () => {
            const t0 = performance.now();
            const { data } = await axios.get<BlobRefDetail>(`${ENDPOINT}/detail`, { params: { natural_key } });
            console.log(`[useBlobDetail] fetch ${natural_key}: ${(performance.now() - t0).toFixed(1)}ms`);
            return data;
        },
        enabled: !!natural_key,
        staleTime: Infinity,
        gcTime: Infinity,
    });
}

export async function getBlobData(natural_key: string): Promise<Float32Array> {
    const t0 = performance.now();
    const { data } = await axios.get<ArrayBuffer>(`${ENDPOINT}/data`, {
        params: { natural_key },
        responseType: "arraybuffer",
    });
    console.log(`[getBlobData] fetch ${natural_key}: ${(performance.now() - t0).toFixed(1)}ms (${data.byteLength} bytes)`);
    return new Float32Array(data);
}

export function useBlobData(natural_key?: string | null) {
    return useQuery<Float32Array, Error>({
        queryKey: ["blobData", natural_key],
        queryFn: () => getBlobData(natural_key!),
        enabled: !!natural_key,
        staleTime: Infinity,
        gcTime: Infinity,
    });
}
