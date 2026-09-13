import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/audit";

export const USER_ACTOR = "user";  // only this actor's notes are editable

export type AuditEvent = {
    id: number
    target_type: string  // where the event happened. for an object this may be an ancestor
    target_key: string
    action: string       // flag_added, flag_removed
    flag_name: string | null
    actor: string        // 'user', or the classification step's own name
    note: string | null
    created_at: string
}

// an object's history includes its ancestors' events, so there is no separate call for those.
// unpaginated on purpose - there are only ever a handful per object
export function getAuditEvents(target_type: string, target_key: string, enabled: boolean = true) {
    return useQuery<AuditEvent[], Error>({
        queryKey: ["audit", target_type, target_key],
        queryFn: async () => {
            const { data } = await axios.get<AuditEvent[]>(ENDPOINT, { params: { target_type, target_key, limit: 1000 } });
            return data;
        },
        enabled,
    });
}

export function useUpdateAuditNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: number, note: string | null }) =>
            axios.patch(`${ENDPOINT}/${vars.id}`, { note: vars.note }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit"] }),
    });
}
