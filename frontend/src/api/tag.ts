import { useQuery } from "@tanstack/react-query";
import { axios } from "./axios";

const ENDPOINT = "/tags";

export type Tag = {
    id: number
    name: string
    description: string
    color: string  // dotted mui palette path, ex. 'error.light'
}

export function getTags() {
    return useQuery<Tag[], Error>({
        queryKey: ["tags"],
        queryFn: async () => {
            const { data } = await axios.get<Tag[]>(ENDPOINT);
            return data;
        },
    });
}
