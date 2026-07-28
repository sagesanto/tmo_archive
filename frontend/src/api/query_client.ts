import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
// import { webCreateError } from "@utils/errors";


export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5000,
            retry: false
        }
    },
    queryCache: new QueryCache({
        // onError: (error, query) => {
        //     webCreateError({ 
        //         error_message: error.message, 
        //         misc: JSON.stringify({
        //             type: "query",
        //             key: query.queryKey
        //         })
        //     });
        // }
    }),
    mutationCache: new MutationCache({
        // onError: (error, variables, context, mutation) => {
        //     webCreateError({
        //         error_message: error.message,
        //         misc: JSON.stringify({
        //             type: "mutation",
        //             variables: variables,
        //             context: context || "none"
        //         })
        //     });
        // }
    })  
});