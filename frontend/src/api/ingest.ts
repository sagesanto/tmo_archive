import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/admin/ingest";

export type IngestJob = {
    id: number
    status: string  // pending | running | success | error
    trigger: string  // manual | scheduled
    requested_at: string
    started_at: string | null
    finished_at: string | null
    error: string | null
    summary: Record<string, any> | null
}

export function getIngestJobs(limit: number = 20) {
    return useQuery<IngestJob[], Error>({
        queryKey: ["ingest_jobs"],
        queryFn: async () => {
            const { data } = await axios.get<IngestJob[]>(`${ENDPOINT}/jobs`, { params: { limit } });
            return data;
        },
        refetchInterval: 3000,
    });
}

export function useTriggerIngest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => axios.post(`${ENDPOINT}/trigger`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingest_jobs"] }),
    });
}
