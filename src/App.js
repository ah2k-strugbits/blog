import React from "react";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { posts } from "@wix/blog";
const App = () => {
  const [data, setData] = React.useState([]);
  const testFunc = async () => {
    console.log("testFunc");
    const myWixClient = await createClient({
      modules: {
        posts,
      },
      auth: OAuthStrategy({
        clientId: "c370cd92-21ab-433b-b95f-d26077bce257",
      }),
    });
    const tokens = await myWixClient.auth.generateVisitorTokens();
    await myWixClient.auth.setTokens(tokens);
    const post = await myWixClient.posts.getPost("632a9f902384acfb0919b328", {
      fieldsToInclude: [
        "RICH_CONTENT",
        "RICH_CONTENT_STRING",
        "RICH_CONTENT_COMPRESSED",
        "CONTENT_TEXT",
        "CONTENT",
      ],
    });
    console.log("Post -> ", post);
    let blogData = [];
    
    setData(blogData);
  };
  React.useEffect(() => {
    testFunc();
    console.log("data: ", data);
  }, [data]);
  return (
    <div>
      <h1>Blog</h1>
    </div>
  );
}
export default App;