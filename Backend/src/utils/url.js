// 🔹 Extract YouTube metadata using oEmbed

import axios from 'axios';
import * as cheerio from 'cheerio';
export async function getYoutubeMeta(url) {
    try {
        const endpoint = `https://www.youtube.com/oembed?url=${url}&format=json`;

        const { data } = await axios.get(endpoint);

        return {
            title: data.title,
            thumbnail: data.thumbnail_url,
            content: data.author_name
        };
    } catch (err) {
        console.log("YouTube metadata fetch failed");
        return null;
    }
}

// 🔹 Scrape normal websites
export async function scrapeWebsite(url) {
   try {
        // Use a "Social Media Bot" User-Agent. 
        // This specific one often bypasses the 503 for image extraction.
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
            }
        });

        const $ = cheerio.load(data);

        // X puts the high-res image in 'twitter:image' or 'og:image'
        const postImage = $('meta[name="twitter:image"]').attr('content') || 
                          $('meta[property="og:image"]').attr('content');

        const postTitle = $('meta[property="og:title"]').attr('content') || 
                          $('meta[name="twitter:title"]').attr('content');

        return {
            title: postTitle || "X Post",
            description: $('meta[property="og:description"]').attr('content') || "",
            image: postImage || "https://abs.twimg.com/icons/apple-touch-icon-192x192.png"
        };
    } catch (error) {
        console.error("Scrape Error, trying oEmbed Fallback...");
        return await getOEmbedFallback(url);
    }
}

// 🔹 Detect content type
export function detectType(url) {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitter.com") || url.includes("x.com")) return "x";
    
    
    if (url.endsWith(".pdf")) return "pdf";
    if (
        url.includes("images.unsplash.com") ||
        url.includes("cdn.pixabay.com") ||
        url.includes("plus.unsplash.com")
    ) return "image";

    if(url.includes("medium.com") || url.includes("dev.to")) return "article";
    if(url.includes("drive.google.com" || url.includes("pdf"))) return "pdf"
    
    return "article"
}


export function cleanYoutubeUrl(url) {
    try {
        const parsed = new URL(url);

        // get only video id
        const videoId = parsed.searchParams.get("v");

        if (!videoId) return url;

        return `https://www.youtube.com/watch?v=${videoId}`;
    } catch {
        return url;
    }
}



export async function getUnsplashFromImage(url) {
    try {
        const match = url.match(/photo-([a-zA-Z0-9-]+)/);
        if (!match) return null;

        const keyword = match[1]; // use as search query

        console.log("dhaadjskahdas",keyword)

        const response = await axios.get(
            `https://api.unsplash.com/search/photos`,
            {
                headers: {
                    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                },
                params: {
                    query: keyword,
                    per_page: 1
                }
            }
        );

        console.log(response.status)
        console.log(response.statusText)
        console.log(response.data)

        const result = response.data.results[0];

        console.log(result)

        if (!result) return null;

        return {
            title: result.alt_description || "Unsplash Image",
            thumbnail: result.urls.regular,
            content: result.user.name,
            realUrl: result.links.html
        };

    } catch (err) {
        console.log("Search fallback failed:", err.message);
       
    }
}




export async function generateImageMeta(imageUrl) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Describe this image in 1 short title and 1 line description" },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 100
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("AI response:", response);

        const text = response.data.choices[0].message.content;

        return text;

    } catch (err) {
        console.log("AI failed:", err.message);
       
    }
}


export async function getTwitterFreeMeta(url) {
    try {
        // 1️⃣ Get oEmbed (text + author)
        const oembedRes = await axios.get(
            `https://publish.twitter.com/oembed?url=${url}`
        );

        const $ = cheerio.load(oembedRes.data.html);
        const tweetText = $("p").text();

        // 2️⃣ Get OG image (scrape)
        const { data } = await axios.get(url, {
            headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.google.com/"
    }
        });

        const $$ = cheerio.load(data);

        const image =
            $$('meta[property="og:image"]').attr("content") ||
            $$('meta[name="twitter:image"]').attr("content");

        return {
            title: tweetText?.slice(0, 80) || "X Post",
            description: tweetText || "",
            image: image || "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
            author: oembedRes.data.author_name
        };

    } catch (err) {
        console.log("Free Twitter meta failed:", err.message);
        return null;
    }
}


export function extractDriveFileId(url) {
    const match = url.match(/\/d\/([^/]+)/);
    return match ? match[1] : null;
}

export function getDriveMeta(url) {
    const fileId = extractDriveFileId(url);

    if (!fileId) return null;

    return {
        title: "Google Drive File",
        description: "PDF / Document from Drive",
        image: `https://drive.google.com/thumbnail?id=${fileId}`,
        file: `https://drive.google.com/uc?export=download&id=${fileId}`,
        embed: `https://drive.google.com/file/d/${fileId}/preview`
    };
}


export async function getArticleMeta(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
            },
            timeout: 5000
        });

        const $ = cheerio.load(data);

        // ✅ Title (multi fallback)
        let title =
            $('meta[property="og:title"]').attr("content") ||
            $('meta[name="twitter:title"]').attr("content") ||
            $("title").text() ||
            $("h1").first().text();

        // ✅ Description
        let description =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            "";

        // ✅ Image
        let image =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") ||
            "";

        return {
            title: title?.trim() || "Untitled Article",
            description: description?.trim() || "",
            image,
            source: new URL(url).hostname
        };

    } catch (err) {
        console.log("Article meta failed:", err.message);

        return {
            title: "Saved Article",
            description: "",
            image: "",
        };
    }
}
