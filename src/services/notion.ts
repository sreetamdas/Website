import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { Blog, Blogs, Book, Project } from 'types';
import { minutesToRead } from './read';

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const n2m = new NotionToMarkdown({ notionClient: notion });

class Notion {
  async getPosts(): Promise<Array<Blogs>> {
    try {
      const posts = await notion.databases.query({
        database_id: process.env.NOTION_BLOG_DATABASE_ID as string,
        sorts: [
          {
            property: 'published',
            direction: 'descending'
          }
        ],
        filter: {
          and: [
            {
              property: 'active',
              checkbox: {
                equals: true
              }
            },
            {
              property: 'environment',
              multi_select: {
                contains: process.env.NOTION_ENVIRONMENT as string
              }
            }
          ]
        }
      });

      // @ts-ignore
      const blogs: Array<Blogs> = posts.results?.map((post: any) => {
        return {
          id: post.id,
          title: post?.properties?.name?.title?.[0].plain_text,
          description:
            post?.properties?.subtitle?.rich_text[0]?.plain_text || '',
          slug: post?.properties?.slug?.rich_text[0]?.plain_text || '/404',
          publishedAt:
            post?.properties?.published?.date?.start ?? 'unknown-date',
          views: post?.properties?.views?.number,
          publicationUrl: post?.properties?.publicationUrl?.url?.trim() || null
        };
      });

      return blogs;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // / Get a Notion database page info by ID
  async getPageInfo(page_id: string): Promise<Blog> {
    // @ts-ignore
    const page: any = await notion.pages.retrieve({ page_id });
    const markdown = await this.getMakrkdown(page_id);

    const blog: Blog = {
      id: page.id,
      title: page?.properties?.name?.title?.[0].plain_text,
      description: page?.properties?.subtitle?.rich_text[0]?.plain_text || '',
      slug: page?.properties?.slug?.rich_text[0]?.plain_text,
      publishedAt: page?.properties?.published?.date?.start ?? 'unknown-date',
      readTime: minutesToRead(markdown),
      views: page?.properties?.views?.number,
      markdown: markdown,
      canonicalUrl: page?.properties?.canonicalUrl?.url?.trim() || null,
      publicationUrl: page?.properties?.publicationUrl?.url?.trim() || null,
      thumbnail: page?.properties?.thumbnail?.files[0]?.file?.url || null
    };

    return blog;
  }

  async getPageContent(block_id: string) {
    const baseQuery = {
      block_id: block_id,
      page_size: 100
    };
    let results = [];
    let postContent = await notion.blocks.children.list(baseQuery);

    results = [...postContent.results];

    while (postContent.has_more && postContent.next_cursor) {
      postContent = await notion.blocks.children.list({
        ...baseQuery,
        start_cursor: postContent.next_cursor
      });
      results = [...results, ...postContent.results];
    }

    return results;
  }

  async getMakrkdown(page_id: string) {
    const mdblocks = await n2m.pageToMarkdown(page_id);
    const mdString = n2m.toMarkdownString(mdblocks);

    return mdString;
  }

  async updateViews(page_id: string) {
    const view = (await this.getPageInfo(page_id)).views ?? 0;

    const page = await notion.pages.update({
      page_id,
      properties: {
        views: {
          number: view + 1
        }
      }
    });

    // @ts-ignore
    return page?.properties?.views?.number;
  }

  async getBooks(): Promise<Array<Book>> {
    try {
      const db = await notion.databases.query({
        database_id: process.env.NOTION_BOOKS_DATABASE_ID!
      });

      const books: Array<Book> = db.results?.map((book: any) => {
        return {
          title: book?.properties?.name?.title?.[0].plain_text,
          author: book?.properties?.author?.rich_text?.[0].plain_text,
          progress: book?.properties?.progress?.select?.name,
          url: book?.properties?.url?.url?.trim() || null,
          image: book?.properties?.image?.url?.trim() || null
        };
      });
      return books;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async createBookSuggestion(title: string, authors: string, reason: string) {
    const page = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_BOOKS_DATABASE_ID!
      },

      properties: {
        name: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        },
        progress: {
          select: {
            name: 'suggested',
            color: 'blue'
          }
        },
        author: {
          rich_text: [
            {
              text: {
                content: authors
              }
            }
          ]
        },
        reason: {
          rich_text: [
            {
              text: {
                content: reason
              }
            }
          ]
        }
      }
    });

    return page;
  }

  async getProjects(): Promise<Array<Project>> {
    try {
      const db = await notion.databases.query({
        database_id: process.env.NOTION_PROJECTS_DATABASE_ID!,
        filter: {
          and: [
            {
              property: 'active',
              checkbox: {
                equals: true
              }
            }
          ]
        }
      });

      const projects: Array<Project> = db.results?.map((project: any) => {
        return {
          title: project?.properties?.Name?.title?.[0]?.plain_text,
          description:
            project?.properties?.description?.rich_text[0]?.plain_text || '',
          live: project?.properties?.live_link?.url?.trim() || null,
          repo: project?.properties?.repo_link?.url?.trim() || null
        };
      });

      return projects;
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}

export default Notion;
