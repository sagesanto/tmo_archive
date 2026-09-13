import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/flags";

// flags with a scope other than 'object' are attached to an ancestor and inherited by its
// objects. they can only be toggled on that ancestor's detail page
export type EntityScope = 'observation' | 'run' | 'mpc';
export type EntityTarget = { target_type: EntityScope, target_key: string };

export type Flag = {
    id: number
    name: string
    description: string
    category: string
    color: string  // dotted mui palette path, ex. 'error.light'
    scope: 'object' | EntityScope
    attached?: string  // time flag attached to obj
}

export function getFlags(category?: string, scope?: string) {
    const queryKey = ["flags", category ?? null, scope ?? null];
    return useQuery<Flag[], Error>({
        queryKey: queryKey,
        queryFn: async () => {
            const { data } = await axios.get<Flag[]>(ENDPOINT, { params: { category, scope } });
            return data;
        },
    });
}

export function getEntityFlags(target: EntityTarget, enabled: boolean = true) {
    return useQuery<Flag[], Error>({
        queryKey: ["entity_flags", target.target_type, target.target_key],
        queryFn: async () => {
            const { data } = await axios.get<Flag[]>(`${ENDPOINT}/entity`, { params: target });
            return data;
        },
        enabled,
    });
}

function invalidateObjectFlags(queryClient: ReturnType<typeof useQueryClient>, object_key: string) {
    queryClient.invalidateQueries({ queryKey: ["object", object_key] });
    queryClient.invalidateQueries({ queryKey: ["objects"] });
    queryClient.invalidateQueries({ queryKey: ["audit"] });  // the change is logged
}

// an entity flag changes what every descendant object carries, so every object query is stale
function invalidateEntityFlags(queryClient: ReturnType<typeof useQueryClient>, target: EntityTarget) {
    queryClient.invalidateQueries({ queryKey: ["entity_flags", target.target_type, target.target_key] });
    queryClient.invalidateQueries({ queryKey: ["object"] });
    queryClient.invalidateQueries({ queryKey: ["objects"] });
    queryClient.invalidateQueries({ queryKey: ["objects_count"] });
    queryClient.invalidateQueries({ queryKey: ["audit"] });  // descendants' histories include this event
}

export function useAddFlagToEntity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: EntityTarget & { flag_id: number, note?: string }) =>
            axios.post(`${ENDPOINT}/entity`, vars),
        onSuccess: (_data, vars) => invalidateEntityFlags(queryClient, vars),
    });
}

export function useRemoveFlagFromEntity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: EntityTarget & { flag_id: number, note?: string }) =>
            axios.delete(`${ENDPOINT}/entity`, { params: vars }),
        onSuccess: (_data, vars) => invalidateEntityFlags(queryClient, vars),
    });
}

// note is optional and lands in the audit log. nothing in the ui sets it yet
export function useAddFlagToObject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { object_key: string, flag_id: number, note?: string }) =>
            axios.post(`${ENDPOINT}/attach`, vars),
        onSuccess: (_data, vars) => invalidateObjectFlags(queryClient, vars.object_key),
    });
}

export function useRemoveFlagFromObject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { object_key: string, flag_id: number, note?: string }) =>
            axios.delete(`${ENDPOINT}/attach`, { params: vars }),
        onSuccess: (_data, vars) => invalidateObjectFlags(queryClient, vars.object_key),
    });
}