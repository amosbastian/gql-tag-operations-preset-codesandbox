import * as React from "react";
import { useGraphqlQuery, useGraphqlMutation } from "./useGraphql";
import { useQueryClient } from "react-query";
import { CreatePostDocument, PostsDocument, SortOrderEnum } from "./api";

export default function App() {
  return (
    <div className="App">
      <h1>Posts</h1>

      {getPosts.isFetching ? (
        <ul>Fetching Data...</ul>
      ) : (
        <ul>
          {getPosts.data?.posts?.data?.map((post) => (
            <li key={post?.id}>
              {post?.id} {post?.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
