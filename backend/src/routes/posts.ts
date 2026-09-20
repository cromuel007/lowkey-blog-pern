import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import crypto from "crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { s3, STORAGE_BUCKET } from "../lib/s3.js";
import geoip from "geoip-lite";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const router = Router();

function getCountryCodeFromIp(
  ip: string | null | undefined
): string | null {
  if (!ip) {
    return null;
  }

  const normalizedIp = ip.startsWith("::ffff:")
    ? ip.substring(7)
    : ip;

  const geo = geoip.lookup(normalizedIp);

  return geo?.country || null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }

    cb(null, true);
  },
});

const postInput = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  published: z.boolean().default(false),
  publishedAt: z.iso.datetime().optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  coverImageUrl: z.url().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  tagIds: z.array(z.number().int().positive()).default([]),
});

const commentInput = z.object({
  author: z.string().trim().max(100).optional().default(""),
  content: z.string().trim().min(1).max(5000),
});

const replyInput = z.object({
  author: z.string().trim().max(100).optional().default(""),
  content: z.string().trim().min(1).max(5000),
});

router.get("/comments", async (req, res) => {
  const isAdmin = req.query.admin === "true";

  const page = Math.max(
    Number.parseInt(req.query.page as string, 10) || 1,
    1
  );

  const pageSize = Math.min(
    Math.max(
      Number.parseInt(req.query.pageSize as string, 10) || 10,
      1
    ),
    100
  );

  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const sortByValue = req.query.sortBy as string;

  const sortOrder =
    req.query.sortOrder === "asc" ? "asc" : "desc";

  const allowedSorts = [
    "post",
    "author",
    "content",
    "likeCount",
    "is_approved",
    "createdAt",
  ] as const;

  type SortBy = (typeof allowedSorts)[number];

  const sortBy: SortBy = allowedSorts.includes(
    sortByValue as SortBy
  )
    ? (sortByValue as SortBy)
    : "createdAt";

  const where = {
    ...(search
      ? {
        OR: [
          {
            author: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            content: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            post: {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
      : {}),
  };

  type OrderByItem =
    | {
      author: "asc" | "desc";
    }
    | {
      content: "asc" | "desc";
    }
    | {
      likeCount: "asc" | "desc";
    }
    | {
      is_approved: "asc" | "desc";
    }
    | {
      createdAt: "asc" | "desc";
    }
    | {
      post: {
        title: "asc" | "desc";
      };
    }
    | {
      id: "asc" | "desc";
    };

  let orderBy: OrderByItem[];

  switch (sortBy) {
    case "post":
      orderBy = [
        {
          post: {
            title: sortOrder,
          },
        },
        {
          id: "desc",
        },
      ];
      break;

    case "author":
      orderBy = [
        {
          author: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "content":
      orderBy = [
        {
          content: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "likeCount":
      orderBy = [
        {
          likeCount: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "is_approved":
      orderBy = [
        {
          is_approved: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "createdAt":
    default:
      orderBy = [
        {
          createdAt: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;
  }

  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where,
      orderBy,
      skip: isAdmin
        ? (page - 1) * pageSize
        : undefined,
      take: isAdmin
        ? pageSize
        : undefined,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            author: true,
          },
        },
      },
    }),

    isAdmin
      ? prisma.postComment.count({ where })
      : Promise.resolve(0),
  ]);

  if (!isAdmin) {
    return res.json(comments);
  }

  return res.json({
    comments,
    total,
    page,
    pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / pageSize)
    ),
  });
});

router.get("/", async (req, res) => {
  const isAdmin = req.query.admin === "true";
  const publishedOnly = !isAdmin;

  const page = Math.max(
    Number.parseInt(req.query.page as string, 10) || 1,
    1
  );

  const pageSize = Math.min(
    Math.max(
      Number.parseInt(req.query.pageSize as string, 10) || 10,
      1
    ),
    100
  );

  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const sortByValue = req.query.sortBy as string;

  const sortOrder =
    req.query.sortOrder === "asc" ? "asc" : "desc";

  const allowedSorts = [
    "title",
    "category",
    "shares",
    "likes",
    "comments",
    "published",
    "publishedAt",
  ] as const;

  type SortBy = (typeof allowedSorts)[number];

  const sortBy: SortBy = allowedSorts.includes(
    sortByValue as SortBy
  )
    ? (sortByValue as SortBy)
    : "publishedAt";

  const where = {
    ...(publishedOnly
      ? {
        published: true,
      }
      : {}),
    ...(search
      ? {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            slug: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            excerpt: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            content: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            seoTitle: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            seoDescription: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            category: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
      : {}),
  };

  type OrderByItem =
    | {
      title: "asc" | "desc";
    }
    | {
      category: {
        name: "asc" | "desc";
      };
    }
    | {
      shareCount: "asc" | "desc";
    }
    | {
      likeCount: "asc" | "desc";
    }
    | {
      commentCount: "asc" | "desc";
    }
    | {
      published: "asc" | "desc";
    }
    | {
      publishedAt: {
        sort: "asc" | "desc";
        nulls: "first" | "last";
      };
    }
    | {
      createdAt: "asc" | "desc";
    }
    | {
      id: "asc" | "desc";
    };

  let orderBy: OrderByItem[];

  switch (sortBy) {
    case "title":
      orderBy = [
        {
          title: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "category":
      orderBy = [
        {
          category: {
            name: sortOrder,
          },
        },
        {
          id: "desc",
        },
      ];
      break;

    case "shares":
      orderBy = [
        {
          shareCount: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "likes":
      orderBy = [
        {
          likeCount: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "comments":
      orderBy = [
        {
          commentCount: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "published":
      orderBy = [
        {
          published: sortOrder,
        },
        {
          id: "desc",
        },
      ];
      break;

    case "publishedAt":
    default:
      orderBy = [
        {
          publishedAt: {
            sort: sortOrder,
            nulls: "last",
          },
        },
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ];
      break;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: isAdmin
        ? (page - 1) * pageSize
        : undefined,
      take: isAdmin
        ? pageSize
        : undefined,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),

    isAdmin
      ? prisma.post.count({ where })
      : Promise.resolve(0),
  ]);

  if (!isAdmin) {
    return res.json(posts);
  }

  res.json({
    posts,
    total,
    page,
    pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / pageSize)
    ),
  });
});

router.get("/:slug/comments", async (req, res) => {
  const value = req.params.slug;

  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  try {
    const post = await prisma.post.findUnique({
      where: {
        slug: value,
      },
      select: {
        id: true,
        published: true,
      },
    });

    if (!post || !post.published) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const comments = await prisma.postComment.findMany({
      where: {
        postId: post.id,
        parentId: null,
        is_approved: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        replies: {
          where: {
            is_approved: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          include: {
            likes: ipAddress
              ? {
                where: {
                  ip_address: ipAddress,
                },
                select: {
                  id: true,
                },
              }
              : false,
          },
        },
        likes: ipAddress
          ? {
            where: {
              ip_address: ipAddress,
            },
            select: {
              id: true,
            },
          }
          : false,
      },
    });

    const formattedComments = comments.map(
      (comment: typeof comments[number]) => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        countryCode: getCountryCodeFromIp(
          comment.ip_address
        ),
        likes: comment.likeCount,
        liked: Array.isArray(comment.likes)
          ? comment.likes.length > 0
          : false,
        replies: comment.replies.map(
          (reply: typeof comment.replies[number]) => ({
            id: reply.id,
            author: reply.author,
            content: reply.content,
            countryCode: getCountryCodeFromIp(
              reply.ip_address
            ),
            likes: reply.likeCount,
            liked: Array.isArray(reply.likes)
              ? reply.likes.length > 0
              : false,
          })
        ),
      })
    );

    const commentCount = await prisma.postComment.count({
      where: {
        postId: post.id,
        is_approved: true,
      },
    });

    return res.json({
      comments: formattedComments,
      commentCount,
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);

    return res.status(500).json({
      message: "Could not fetch comments.",
    });
  }
});

router.post("/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({
      message: "Invalid post ID.",
    });
  }

  const parsed = commentInput.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid comment data.",
    });
  }

  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
      },
    });

    if (!post || !post.published) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const approvalToken = crypto.randomUUID();

    const comment = await prisma.postComment.create({
      data: {
        postId,
        author:
          parsed.data.author ||
          "Anonymous",
        content: parsed.data.content,
        ip_address: ipAddress,
        is_approved: false,
        approval_token: approvalToken,
      },
    });

    try {
      const notificationEmail =
        process.env.NOTIFICATION_EMAIL;

      if (!notificationEmail) {
        console.error(
          "NOTIFICATION_EMAIL is not configured."
        );
      } else {
        const approvalUrl =
          `${process.env.API_URL}/api/posts/comments/approve/${approvalToken}`;

        await resend.emails.send({
          from: "Comments <onboarding@resend.dev>",
          to: notificationEmail,
          subject: "💬 New Blog Comment",
          html: `
            <h2>
              Someone submitted a new comment! 💬
            </h2>

            <p>
              <strong>Post:</strong>
              ${post.title}
            </p>

            <p>
              <strong>Name:</strong>
              ${comment.author}
            </p>

            <p>
              <strong>Comment:</strong>
            </p>

            <p>
              ${comment.content}
            </p>

            <p>
              <a
                href="${approvalUrl}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  border:1px solid #2563eb;
                  border-radius:6px;
                  font-weight:600;
                "
              >
                Approve Comment
              </a>
            </p>
          `,
        });
      }
    } catch (emailError) {
      console.error(
        "Comment notification email failed:",
        emailError
      );
    }

    return res.status(201).json({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      countryCode: getCountryCodeFromIp(
        comment.ip_address
      ),
      likes: comment.likeCount,
      liked: false,
      replies: [],
      is_approved: comment.is_approved,
      message:
        "Comment submitted and is awaiting approval.",
    });
  } catch (error) {
    console.error(
      "Failed to create comment:",
      error
    );

    return res.status(500).json({
      message: "Could not create comment.",
    });
  }
});

router.post("/:id/comments/:commentId/replies", async (req, res) => {
  const postId = Number(req.params.id);
  const commentId = Number(req.params.commentId);

  if (
    !Number.isInteger(postId) ||
    postId <= 0 ||
    !Number.isInteger(commentId) ||
    commentId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid post or comment ID.",
    });
  }

  const parsed = replyInput.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid reply data.",
    });
  }

  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  try {
    const parentComment =
      await prisma.postComment.findFirst({
        where: {
          id: commentId,
          postId,
          parentId: null,
          is_approved: true,
          post: {
            published: true,
          },
        },
        select: {
          id: true,
          author: true,
          content: true,
          post: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      });

    if (!parentComment) {
      return res.status(404).json({
        message: "Comment not found.",
      });
    }

    const approvalToken = crypto.randomUUID();

    const reply = await prisma.postComment.create({
      data: {
        postId,
        parentId: commentId,
        author:
          parsed.data.author ||
          "Anonymous",
        content: parsed.data.content,
        ip_address: ipAddress,
        is_approved: false,
        approval_token: approvalToken,
      },
    });

    try {
      const notificationEmail =
        process.env.NOTIFICATION_EMAIL;

      if (!notificationEmail) {
        console.error(
          "NOTIFICATION_EMAIL is not configured."
        );
      } else {
        const approvalUrl =
          `${process.env.API_URL}/api/posts/comments/approve/${approvalToken}`;

        await resend.emails.send({
          from: "Comments <onboarding@resend.dev>",
          to: notificationEmail,
          subject: "💬 New Blog Comment Reply",
          html: `
              <h2>
                Someone replied to a blog comment! 💬
              </h2>

              <p>
                <strong>Post:</strong>
                ${parentComment.post.title}
              </p>

              <p>
                <strong>Replying to:</strong>
                ${parentComment.author}
              </p>

              <p>
                <strong>Original Comment:</strong>
              </p>

              <p>
                ${parentComment.content}
              </p>

              <p>
                <strong>Reply Author:</strong>
                ${reply.author}
              </p>

              <p>
                <strong>Reply:</strong>
              </p>

              <p>
                ${reply.content}
              </p>

              <p>
                <a
                  href="${approvalUrl}"
                  style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    border:1px solid #2563eb;
                    border-radius:6px;
                    font-weight:600;
                  "
                >
                  Approve Reply
                </a>
              </p>
            `,
        });
      }
    } catch (emailError) {
      console.error(
        "Reply notification email failed:",
        emailError
      );
    }

    return res.status(201).json({
      id: reply.id,
      author: reply.author,
      content: reply.content,
      countryCode: getCountryCodeFromIp(
        reply.ip_address
      ),
      likes: reply.likeCount,
      liked: false,
      replies: [],
      is_approved: reply.is_approved,
      message:
        "Reply submitted and is awaiting approval.",
    });
  } catch (error) {
    console.error(
      "Failed to create reply:",
      error
    );

    return res.status(500).json({
      message: "Could not create reply.",
    });
  }
}
);

router.get("/comments/approve/:approvalToken", async (req, res) => {
  const { approvalToken } = req.params;

  try {
    const comment =
      await prisma.postComment.findUnique({
        where: {
          approval_token: approvalToken,
        },
        select: {
          id: true,
          postId: true,
          is_approved: true,
        },
      });

    if (!comment || comment.is_approved) {
      return res.status(404).send(
        "Invalid or expired approval link."
      );
    }

    await prisma.$transaction([
      prisma.postComment.update({
        where: {
          id: comment.id,
        },
        data: {
          is_approved: true,
          approval_token: null,
        },
      }),

      prisma.post.update({
        where: {
          id: comment.postId,
        },
        data: {
          commentCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Comment Approved</title>
          </head>

          <body
            style="
              font-family: sans-serif;
              max-width: 600px;
              margin: 80px auto;
              padding: 20px;
              text-align: center;
            "
          >
            <h1>✅ Comment Approved</h1>

            <p>
              The comment has been approved successfully.
            </p>
          </body>
        </html>
      `);
  } catch (error) {
    console.error(
      "Failed to approve comment:",
      error
    );

    return res.status(500).send(
      "Could not approve comment."
    );
  }
}
);

router.post("/:id/comments/:commentId/like", async (req, res) => {
  const postId = Number(req.params.id);
  const commentId = Number(req.params.commentId);

  if (
    !Number.isInteger(postId) ||
    postId <= 0 ||
    !Number.isInteger(commentId) ||
    commentId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid post or comment ID.",
    });
  }

  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  if (!ipAddress) {
    return res.status(400).json({
      message: "Could not determine IP address.",
    });
  }

  try {
    const comment =
      await prisma.postComment.findFirst({
        where: {
          id: commentId,
          postId,
          post: {
            published: true,
          },
        },
        select: {
          id: true,
          likeCount: true,
        },
      });

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found.",
      });
    }

    const existingLike =
      await prisma.postCommentLike.findFirst({
        where: {
          commentId,
          ip_address: ipAddress,
        },
        select: {
          id: true,
        },
      });

    if (existingLike) {
      const [, updatedComment, updatedPost] =
        await prisma.$transaction([
          prisma.postCommentLike.delete({
            where: {
              id: existingLike.id,
            },
          }),

          prisma.postComment.update({
            where: {
              id: commentId,
            },
            data: {
              likeCount: {
                decrement: 1,
              },
            },
            select: {
              likeCount: true,
            },
          }),

          prisma.post.update({
            where: {
              id: postId,
            },
            data: {
              likeCount: {
                decrement: 1,
              },
            },
            select: {
              likeCount: true,
            },
          }),
        ]);

      return res.status(200).json({
        liked: false,
        likeCount: updatedComment.likeCount,
        postLikeCount: updatedPost.likeCount,
      });
    }

    const [, updatedComment, updatedPost] =
      await prisma.$transaction([
        prisma.postCommentLike.create({
          data: {
            commentId,
            ip_address: ipAddress,
          },
        }),

        prisma.postComment.update({
          where: {
            id: commentId,
          },
          data: {
            likeCount: {
              increment: 1,
            },
          },
          select: {
            likeCount: true,
          },
        }),

        prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            likeCount: {
              increment: 1,
            },
          },
          select: {
            likeCount: true,
          },
        }),
      ]);

    return res.status(200).json({
      liked: true,
      likeCount: updatedComment.likeCount,
      postLikeCount: updatedPost.likeCount,
    });
  } catch (error) {
    console.error(
      "Failed to toggle comment like:",
      error
    );

    return res.status(500).json({
      message: "Could not update comment like.",
    });
  }
}
);

router.get("/:slug", async (req, res) => {
  const value = req.params.slug;
  const id = Number(value);

  const include = {
    category: true,
    tags: {
      include: {
        tag: true,
      },
    },
  };

  // Numeric values are treated as post IDs for authenticated admin requests.
  if (Number.isInteger(id) && id > 0) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    try {
      await new Promise<void>((resolve, reject) => {
        requireAuth(req, res, (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    } catch {
      return;
    }

    const post = await prisma.post.findUnique({
      where: {
        id,
      },
      include,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    return res.json(post);
  }

  // Get visitor IP for public like/share status.
  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  // Normal public post lookup by slug.
  const post = await prisma.post.findUnique({
    where: {
      slug: value,
    },
    include,
  });

  if (!post || !post.published) {
    return res.status(404).json({
      message: "Post not found.",
    });
  }

  const liked = ipAddress
    ? await prisma.postLike.findFirst({
      where: {
        postId: post.id,
        ip_address: ipAddress,
      },
      select: {
        id: true,
      },
    })
    : null;

  const shared = ipAddress
    ? await prisma.postShare.findFirst({
      where: {
        postId: post.id,
        ip_address: ipAddress,
      },
      select: {
        id: true,
      },
    })
    : null;

  return res.json({
    ...post,
    liked: !!liked,
    shared: !!shared,
  });
});

router.post("/:id/share", async (req, res) => {
  const postId = Number(req.params.id);
  const { platform } = req.body;

  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  if (!Number.isInteger(postId)) {
    return res.status(400).json({
      message: "Invalid post ID.",
    });
  }

  if (!platform || typeof platform !== "string") {
    return res.status(400).json({
      message: "Platform is required.",
    });
  }

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const share = await prisma.postShare.create({
      data: {
        postId,
        platform: platform.trim(),
        ip_address: ipAddress,
      },
    });

    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        shareCount: {
          increment: 1,
        },
      },
      select: {
        shareCount: true,
      },
    });

    return res.status(201).json({
      share,
      shareCount: updatedPost.shareCount,
    });
  } catch (error) {
    console.error(
      "Failed to track post share:",
      error
    );

    return res.status(500).json({
      message: "Could not track post share.",
    });
  }
});

router.post("/:id/like", async (req, res) => {
  const postId = Number(req.params.id);

  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    req.socket.remoteAddress ||
    null;

  if (!Number.isInteger(postId)) {
    return res.status(400).json({
      message: "Invalid post ID.",
    });
  }

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const existingLike =
      await prisma.postLike.findFirst({
        where: {
          postId,
          ip_address: ipAddress,
        },
      });

    if (existingLike) {
      await prisma.postLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      const updatedPost = await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
        select: {
          likeCount: true,
        },
      });

      return res.status(200).json({
        liked: false,
        likeCount: updatedPost.likeCount,
      });
    }

    await prisma.postLike.create({
      data: {
        postId,
        platform: "",
        ip_address: ipAddress,
      },
    });

    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        likeCount: {
          increment: 1,
        },
      },
      select: {
        likeCount: true,
      },
    });

    return res.status(200).json({
      liked: true,
      likeCount: updatedPost.likeCount,
    });
  } catch (error) {
    console.error(
      "Failed to toggle post like:",
      error
    );

    return res.status(500).json({
      message: "Could not update post like.",
    });
  }
});

router.post("/upload", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded.",
      });
    }

    const extension =
      req.file.originalname.split(".").pop()?.toLowerCase() ||
      "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: "3600",
      })
    );

    const supabaseUrl = process.env.SUPABASE_URL;

    if (!supabaseUrl) {
      return res.status(500).json({
        message: "SUPABASE_URL is not configured.",
      });
    }

    const publicUrl =
      `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;

    res.status(201).json({
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    res.status(500).json({
      message: "Could not upload image.",
    });
  }
}
);

router.post("/", requireAuth, async (req, res) => {
  const parsed = postInput.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid post data.",
    });
  }

  const {
    tagIds,
    publishedAt,
    ...data
  } = parsed.data;

  try {
    const post = await prisma.post.create({
      data: {
        ...data,
        publishedAt: publishedAt
          ? new Date(publishedAt)
          : null,
        tags: {
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);

    res.status(409).json({
      message:
        "Could not create post. Check that the slug is unique.",
    });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const parsed = postInput.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid post data.",
    });
  }

  const id = Number(req.params.id);

  const {
    tagIds,
    publishedAt,
    ...data
  } = parsed.data;

  try {
    const existing = await prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        coverImageUrl: true,
        publishedAt: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const oldCoverImageUrl = existing.coverImageUrl;
    const newCoverImageUrl = data.coverImageUrl;

    const imageWasRemoved =
      !!oldCoverImageUrl && !newCoverImageUrl;

    const imageWasChanged =
      !!oldCoverImageUrl &&
      !!newCoverImageUrl &&
      oldCoverImageUrl !== newCoverImageUrl;

    const [, post] = await prisma.$transaction([
      prisma.postTag.deleteMany({
        where: {
          postId: id,
        },
      }),

      prisma.post.update({
        where: {
          id,
        },
        data: {
          ...data,
          publishedAt: publishedAt
            ? new Date(publishedAt)
            : existing.publishedAt,
          tags: {
            create: tagIds.map((tagId) => ({
              tagId,
            })),
          },
        },
        include: {
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
    ]);

    if (imageWasRemoved || imageWasChanged) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;

        if (supabaseUrl && oldCoverImageUrl) {
          const prefix =
            `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/`;

          if (oldCoverImageUrl.startsWith(prefix)) {
            const fileName =
              oldCoverImageUrl.slice(prefix.length);

            if (fileName) {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: STORAGE_BUCKET,
                  Key: fileName,
                })
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Could not delete old cover image:",
          error
        );
      }
    }

    res.json(post);
  } catch (error) {
    console.error(error);

    res.status(409).json({
      message: "Could not update post.",
    });
  }
});

router.delete("/comments/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid comment ID.",
      });
    }

    const comment = await prisma.postComment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        postId: true,
        is_approved: true,
        likeCount: true,
      },
    });

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found.",
      });
    }

    // Get all replies that will also be deleted by cascade.
    const replies = await prisma.postComment.findMany({
      where: {
        parentId: id,
      },
      select: {
        id: true,
        is_approved: true,
        likeCount: true,
      },
    });

    // Count all approved comments that will be deleted.
    const approvedCommentsDeleted =
      (comment.is_approved ? 1 : 0) +
      replies.filter(
        (reply: typeof replies[number]) => reply.is_approved
      ).length;

    // Get total likes from the comment and its replies.
    const totalCommentLikes =
      comment.likeCount +
      replies.reduce(
        (
          total: number,
          reply: typeof replies[number]
        ) => total + reply.likeCount,
        0
      );

    // Delete the comment.
    // Related PostCommentLike records and replies
    // are automatically deleted because of onDelete: Cascade.
    await prisma.postComment.delete({
      where: {
        id,
      },
    });

    // Update the post counts.
    if (approvedCommentsDeleted > 0 || totalCommentLikes > 0) {
      await prisma.post.update({
        where: {
          id: comment.postId,
        },
        data: {
          ...(approvedCommentsDeleted > 0 && {
            commentCount: {
              decrement: approvedCommentsDeleted,
            },
          }),
          ...(totalCommentLikes > 0 && {
            likeCount: {
              decrement: totalCommentLikes,
            },
          }),
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(
      "Delete comment error:",
      error
    );

    res.status(500).json({
      message: "Could not delete comment.",
    });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid post ID.",
      });
    }

    const post = await prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        coverImageUrl: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    if (post.coverImageUrl) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;

        if (supabaseUrl) {
          const prefix =
            `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/`;

          if (post.coverImageUrl.startsWith(prefix)) {
            const fileName =
              post.coverImageUrl.slice(prefix.length);

            if (fileName) {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: STORAGE_BUCKET,
                  Key: fileName,
                })
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Could not delete cover image:",
          error
        );
      }
    }

    await prisma.post.delete({
      where: {
        id,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error(
      "Delete post error:",
      error
    );

    res.status(500).json({
      message: "Could not delete post.",
    });
  }
});

export default router;