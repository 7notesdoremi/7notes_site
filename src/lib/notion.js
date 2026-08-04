import { Client } from "@notionhq/client";

const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });
const databaseId = import.meta.env.NOTION_DATABASE_ID;

export async function getArticles(category) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        { property: "公開状態", select: { equals: "公開" } },
        ...(category
          ? [{ property: "カテゴリ", select: { equals: category } }]
          : []),
      ],
    },
    sorts: [{ property: "公開日", direction: "descending" }],
  });

  return response.results.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      title: props["名前"]?.title?.[0]?.plain_text ?? "無題",
      category: props["カテゴリ"]?.select?.name ?? "",
      date: props["公開日"]?.date?.start ?? "",
      excerpt: props["抜粋"]?.rich_text?.[0]?.plain_text ?? "",
      thumbnail:
        props["サムネイル"]?.files?.[0]?.file?.url ??
        props["サムネイル"]?.files?.[0]?.external?.url ??
        "",
    };
  });
}
// 記事1件の詳細（本文）を取得
export async function getArticle(pageId) {
  // ページのプロパティを取得
  const page = await notion.pages.retrieve({ page_id: pageId });
  const props = page.properties;

  // ページ本文のブロックを取得
  const blocks = await notion.blocks.children.list({ block_id: pageId });

  return {
    id: page.id,
    title: props["名前"]?.title?.[0]?.plain_text ?? "無題",
    date: props["公開日"]?.date?.start ?? "",
    thumbnail:
      props["サムネイル"]?.files?.[0]?.file?.url ??
      props["サムネイル"]?.files?.[0]?.external?.url ??
      "",
    blocks: blocks.results,
  };
}

// 全記事のIDリストを取得（ページ生成用）
export async function getAllArticleIds() {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { property: "公開状態", select: { equals: "公開" } },
  });
  return response.results.map((page) => page.id);
}
