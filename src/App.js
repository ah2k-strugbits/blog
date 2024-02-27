import { createClient, OAuthStrategy } from "@wix/sdk";
import React from "react";
import { posts } from "@wix/blog";
import ReactPlayer from "react-player";
// import * as dotenv from "dotenv";
// dotenv.config();
function App() {
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
    // const postss = await myWixClient.posts.listPosts();
    console.log("Post -> ", post);
    let blogData = [];
    // setting cover image
    if (post?.coverMedia?.image) {
      let wixImageURL = "";
      wixImageURL = "https://static.wixstatic.com/media/";
      let wixLocalURL = "";
      wixLocalURL = post?.coverMedia?.image?.replace("wix:image://v1/", "");
      wixLocalURL = wixLocalURL.slice(0, wixLocalURL.indexOf("/"));
      blogData.push({
        type: "cover",
        image: `${wixImageURL}${wixLocalURL}`,
        sq: 0,
      });
    }
    // setting content
    post?.richContent?.nodes?.forEach((item, index) => {
      if (item.type === "PARAGRAPH") {
        // handling paragraphs
        if (item.nodes.length > 0) {
          let finalText = "";
          item.nodes.forEach((node) => {
            if (node.type === "TEXT") {
              if (
                node.textData.decorations.findIndex(
                  (item) => item === "LINK"
                ) !== -1
              ) {
                let link = node.textData.decorations.find(
                  (item) => item.type === "LINK"
                ).linkData.link.url;
                finalText += ` <a href="${link}">${node.textData.text}</a>`;
              } else {
                finalText += node.textData.text;
              }
            }
          });
          console.log("finalText -> ", finalText);
          blogData.push({
            type: "paragraph",
            text: finalText,
            sq: index + 1,
          });
        } else {
          blogData.push({
            type: "line-break",
            sq: index + 1,
          });
        }
      } else if (item.type === "HEADING") {
        // handling headings
        if (item.nodes.length > 0) {
          let finalText = "";
          let level = item.headingData.level;
          item.nodes.forEach((node) => {
            if (node.type === "TEXT") {
              finalText += node.textData.text;
            }
          });
          blogData.push({
            type: "heading",
            text: finalText,
            level: level,
            sq: index + 1,
          });
        } else {
          blogData.push({
            type: "line-break",
            sq: index + 1,
          });
        }
      } else if (item.type === "VIDEO") {
        // handling videos
        blogData.push({
          type: "video",
          video:
            item.videoData.video.src.url ||
            `https://video.wixstatic.com/${item.videoData.video.src._id}`,
          thumbnail:
            item.videoData.thumbnail.src.url ||
            `https://static.wixstatic.com/${item.videoData.thumbnail.src._id}`,
          sq: index + 1,
        });
      } else if (item.type === "BULLETED_LIST") {
        // handling bulleted list
        if (item.nodes.length > 0) {
          let items = [];
          item.nodes.forEach((node) => {
            if (node.type === "LIST_ITEM" && node.nodes.length > 0) {
              node.nodes.forEach((nestedNode) => {
                if (nestedNode.type === "PARAGRAPH") {
                  if (nestedNode.nodes.length > 0) {
                    let finalText = "";
                    nestedNode.nodes.forEach((n) => {
                      if (n.type === "TEXT") {
                        finalText += n.textData.text;
                      }
                    });
                    items.push(finalText);
                  } else {
                    items.push("");
                  }
                }
              });
            }
          });
          blogData.push({
            type: "bulleted-list",
            items: items,
            sq: index + 1,
          });
        }
      }
    });
    setData(blogData);
  };
  React.useEffect(() => {
    testFunc();
  }, []);
  return (
    <div>
      {console.log("data -> ", data)}
      {/* <BrowserRouter>
        <Routes>
          <Route path="/" element={<InitialLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/requestToken" element={<RequstToken />} />
              <Route path="/auth/forgot-password" element={<RequstToken />} />
              <Route
                path="/auth/verifyEmail/:email"
                element={<VerifyEmail />}
              />
              <Route
                path="/auth/resetPassword/:email"
                element={<ResetPassword />}
              />
            </Route>
          </Route>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter> */}
      <h1>Blog</h1>
      {data.length > 0 && data[0].type === "cover" ? (
        <img
          src={data[0].image}
          alt="cover"
          style={{
            width: "100%",
            height: "500px",
            objectFit: "cover",
          }}
        />
      ) : (
        <h1>No Cover</h1>
      )}
      {data.map((item, index) => {
        if (item.type === "paragraph") {
          return <p key={index}>{item.text}</p>;
        } else if (item.type === "line-break") {
          return <br key={index} />;
        } else if (item.type === "heading") {
          return (
            <h1 key={index} style={{ fontSize: `${item.level * 20}px` }}>
              {item.text}
            </h1>
          );
        } else if (item.type === "video") {
          return (
            <div
              key={index}
              style={{
                padding: "50px",
              }}
            >
              <ReactPlayer
                url={item.video}
                width="100%"
                height="500px"
                controls
                light={item.thumbnail}
                playing
              />
            </div>
          );
        } else if (item.type === "bulleted-list") {
          return (
            <ul key={index}>
              {item.items.map((listItem, index) => (
                <li key={index}>{listItem}</li>
              ))}
            </ul>
          );
        }
      })}
    </div>
  );
}
export default App;