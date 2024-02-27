import { createClient, OAuthStrategy } from "@wix/sdk";
import React from "react";
import { posts, tags } from "@wix/blog";
import ReactPlayer from "react-player";
// import * as dotenv from "dotenv";
// dotenv.config();
function App() {
  const [data, setData] = React.useState([]);
  const getImageURL = (src) => `https://static.wixstatic.com/media/${src}`;

  const getBlogData = async () => {
    const myWixClient = await createClient({
      modules: { posts, tags },
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

    const blogData = [];

    // Cover Image
    const coverImage = post?.coverMedia?.image;
    if (coverImage) {
      const wixLocalURL = coverImage
        .replace("wix:image://v1/", "")
        .split("/")[0];
      const imageURL = `https://static.wixstatic.com/media/${wixLocalURL}`;
      blogData.push({ type: "cover", image: imageURL, sq: 0 });
    }

    // Tags
    const tagsData = await Promise.allSettled(
      post.tagIds.map((tag) =>
        myWixClient.tags.getTag(tag).then((tagData) => tagData.label)
      )
    );
    const tagsResolved = tagsData
      .filter((tag) => tag.status === "fulfilled")
      .map((tag) => tag.value);
    blogData.push({ type: "tags", tags: tagsResolved });

    // Content
    for (const [index, item] of post?.richContent?.nodes?.entries() || []) {
      switch (item.type) {
        case "PARAGRAPH": {
          const finalText = item.nodes
            .filter((node) => node.type === "TEXT")
            .map((node) => {
              if (node.textData.decorations.some((item) => item === "LINK")) {
                const link = node.textData.decorations.find(
                  (item) => item.type === "LINK"
                ).linkData.link.url;
                return `<a href="${link}">${node.textData.text}</a>`;
              }
              return node.textData.text;
            })
            .join("");
          blogData.push({ type: "paragraph", text: finalText });
          break;
        }
        case "HEADING": {
          const finalText = item.nodes
            .filter((node) => node.type === "TEXT")
            .map((node) => node.textData.text)
            .join("");
          const level = item.headingData.level;
          blogData.push({
            type: "heading",
            text: finalText,
            level,
          });
          break;
        }
        case "VIDEO": {
          const videoURL =
          item.videoData.video.src.url ||
          `https://video.wixstatic.com/${item.videoData.video.src._id}`;
          const thumbnailURL =
          item.videoData.thumbnail.src.url ||
          `https://static.wixstatic.com/${item.videoData.thumbnail.src._id}`
          blogData.push({
            type: "video",
            video: videoURL,
            thumbnail: thumbnailURL,
          });
          break;
        }
        case "BULLETED_LIST": {
          const items = item.nodes.flatMap((node) => {
            if (node.type === "LIST_ITEM") {
              return node.nodes
                .filter((nestedNode) => nestedNode.type === "PARAGRAPH")
                .map((nestedNode) =>
                  nestedNode.nodes.map((n) => n.textData.text).join("")
                );
            }
            return [];
          });
          blogData.push({ type: "bulleted-list", items });
          break;
        }
        case "IMAGE": {
          const imageURL = getImageURL(item.imageData.image.src._id);
          blogData.push({ type: "image", image: imageURL });
          break;
        }
        case "GALLERY": {
          const images = item.galleryData.items.map((image) =>
            getImageURL(image.image.media.src.url)
          );
          blogData.push({ type: "gallery", images });
          break;
        }
        default:
          break;
      }
    }

    setData(blogData);
  };
  React.useEffect(() => {
    getBlogData();
  }, []);
  return (
    <div>
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
        } else if (item.type === "image") {
          return (
            <img
              key={index}
              src={item.image}
              alt="cover"
              style={{
                width: "100%",
                height: "500px",
                objectFit: "cover",
              }}
            />
          );
        } else if (item.type === "gallery") {
          return (
            <div key={index} style={{ display: "flex" }}>
              {item.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt="cover"
                  style={{
                    width: "100%",
                    height: "500px",
                    objectFit: "cover",
                  }}
                />
              ))}
            </div>
          );
        } else if (item.type === "tags") {
          return (
            <div key={index}>
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    padding: "10px",
                    margin: "10px",
                    border: "1px solid black",
                    borderRadius: "10px",
                    display: "inline-block",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          );
        }
      })}
    </div>
  );
}
export default App;
