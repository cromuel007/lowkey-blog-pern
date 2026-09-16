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
import { Prisma } from "@prisma/client";

const router = Router();

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

  let orderBy: Prisma.PostFindManyArgs["orderBy"];

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
      // Reuse the same authentication middleware.
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

  res.json(post);
});

router.post(
  "/upload",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded.",
        });
      }

      const extension =
        req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";

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

    const post = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.postTag.deleteMany({
          where: {
            postId: id,
          },
        });

        return tx.post.update({
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
        });
      }
    );

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
    console.error("Delete post error:", error);

    res.status(500).json({
      message: "Could not delete post.",
    });
  }
});

export default router;