import * as React from "react";
import { render } from "react-dom";
import { setGraphqlEndpoint } from "./useGraphql";
import { ReactQueryDevtools } from "react-query/devtools";
import { QueryCache, QueryClient, QueryClientProvider } from "react-query";

import App from "./App";

setGraphqlEndpoint("https://graphqlzero.almansi.me/api");

const queryCache = new QueryCache();
const queryClient = new QueryClient({ queryCache });

const rootElement = document.getElementById("root");
render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={true} />
  </QueryClientProvider>,
  rootElement
);
