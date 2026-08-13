import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/flags";

export type Flag = {
    id: number
    name: string
    description: string
    category: string
    color: string  // dotted mui palette path, ex. 'error.light'
    attached?: string  // time flag attached to obj
}

export function getFlags(category?: string) {
    const queryKey = ["flags", category ?? null];
    return useQuery<Flag[], Error>({
        queryKey: queryKey,
        queryFn: async () => {
            const { data } = await axios.get<Flag[]>(ENDPOINT, { params: { category } });
            return data;
        },
    });
}

function invalidateObjectFlags(queryClient: ReturnType<typeof useQueryClient>, object_key: string) {
    queryClient.invalidateQueries({ queryKey: ["object", object_key] });
    queryClient.invalidateQueries({ queryKey: ["objects"] });
}

export function useAddFlagToObject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { object_key: string, flag_id: number }) =>
            axios.post(`${ENDPOINT}/attach`, vars),
        onSuccess: (_data, vars) => invalidateObjectFlags(queryClient, vars.object_key),
    });
}

export function useRemoveFlagFromObject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { object_key: string, flag_id: number }) =>
            axios.delete(`${ENDPOINT}/attach`, { params: vars }),
        onSuccess: (_data, vars) => invalidateObjectFlags(queryClient, vars.object_key),
    });
}