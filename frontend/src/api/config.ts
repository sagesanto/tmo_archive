import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/admin/config";

export type AppConfigEntry = {
    key: string
    value: any
    updated_at: string
}

export function getConfig() {
    return useQuery<AppConfigEntry[], Error>({
        queryKey: ["admin_config"],
        queryFn: async () => {
            const { data } = await axios.get<AppConfigEntry[]>(ENDPOINT);
            return data;
        },
    });
}

export function useSetConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { key: string, value: any }) => axios.put(ENDPOINT, vars),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_config"] }),
    });
}
