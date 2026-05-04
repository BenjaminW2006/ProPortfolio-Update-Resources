import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { projectsTable, siteImagesTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  AddProjectImageBody,
  ProjectIdParam,
  ProjectImageIdParam,
  ProjectResponse,
  ProjectWithImagesResponse,
  ListProjectsResponse,
  ProjectImageItem,
  SetProjectCoverBody,
  SetImageLabelBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

function requireCsrfHeader(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["x-csrf-protection"] === "1") {
    next();
    return;
  }
  res.status(403).json({ error: "CSRF check failed" });
}

router.get("/projects", async (req: Request, res: Response) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.createdAt));
    res.json(ListProjectsResponse.parse(projects));
  } catch (error) {
    req.log.error({ err: error }, "Error fetching projects");
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/projects/:id", async (req: Request, res: Response) => {
  const paramsParsed = ProjectIdParam.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const { id } = paramsParsed.data;
  try {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const images = await db
      .select()
      .from(siteImagesTable)
      .where(eq(siteImagesTable.projectId, id));
    res.json(
      ProjectWithImagesResponse.parse({
        ...project,
        images: images.map((img) => ({
          id: img.id,
          objectPath: img.objectPath,
          uploadedAt: img.uploadedAt,
          label: img.label ?? null,
        })),
      })
    );
  } catch (error) {
    req.log.error({ err: error }, "Error fetching project");
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.post("/projects", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
  const bodyParsed = CreateProjectBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body", details: bodyParsed.error.issues });
    return;
  }
  try {
    const [project] = await db.insert(projectsTable).values(bodyParsed.data).returning();
    res.json(ProjectResponse.parse(project));
  } catch (error) {
    req.log.error({ err: error }, "Error creating project");
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/projects/:id", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
  const paramsParsed = ProjectIdParam.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const bodyParsed = UpdateProjectBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { id } = paramsParsed.data;
  try {
    const [project] = await db
      .update(projectsTable)
      .set(bodyParsed.data)
      .where(eq(projectsTable.id, id))
      .returning();
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(ProjectResponse.parse(project));
  } catch (error) {
    req.log.error({ err: error }, "Error updating project");
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/projects/:id", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
  const paramsParsed = ProjectIdParam.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const { id } = paramsParsed.data;
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.json({ ok: true });
  } catch (error) {
    req.log.error({ err: error }, "Error deleting project");
    res.status(500).json({ error: "Failed to delete project" });
  }
});

router.post(
  "/projects/:id/images",
  requireAdminSession,
  requireCsrfHeader,
  async (req: Request, res: Response) => {
    const paramsParsed = ProjectIdParam.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid project id" });
      return;
    }
    const bodyParsed = AddProjectImageBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Missing objectPath" });
      return;
    }
    const { id } = paramsParsed.data;
    const { objectPath } = bodyParsed.data;
    try {
      const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const [image] = await db
        .insert(siteImagesTable)
        .values({ objectPath, projectId: id })
        .returning();
      res.json(ProjectImageItem.parse({ id: image.id, objectPath: image.objectPath, uploadedAt: image.uploadedAt }));
    } catch (error) {
      req.log.error({ err: error }, "Error adding project image");
      res.status(500).json({ error: "Failed to add image" });
    }
  }
);

router.delete(
  "/projects/:id/images/:imageId",
  requireAdminSession,
  requireCsrfHeader,
  async (req: Request, res: Response) => {
    const paramsParsed = ProjectImageIdParam.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const { id, imageId } = paramsParsed.data;
    try {
      const result = await db
        .delete(siteImagesTable)
        .where(and(eq(siteImagesTable.id, imageId), eq(siteImagesTable.projectId, id)))
        .returning({ id: siteImagesTable.id });
      if (result.length === 0) {
        res.status(404).json({ error: "Image not found in this project" });
        return;
      }
      res.json({ ok: true, imageId });
    } catch (error) {
      req.log.error({ err: error }, "Error deleting project image");
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);

router.patch(
  "/projects/:id/images/:imageId",
  requireAdminSession,
  requireCsrfHeader,
  async (req: Request, res: Response) => {
    const paramsParsed = ProjectImageIdParam.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const bodyParsed = SetImageLabelBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const { id, imageId } = paramsParsed.data;
    const { label } = bodyParsed.data;
    try {
      const [image] = await db
        .update(siteImagesTable)
        .set({ label })
        .where(and(eq(siteImagesTable.id, imageId), eq(siteImagesTable.projectId, id)))
        .returning();
      if (!image) {
        res.status(404).json({ error: "Image not found in this project" });
        return;
      }
      res.json(ProjectImageItem.parse({ id: image.id, objectPath: image.objectPath, uploadedAt: image.uploadedAt, label: image.label ?? null }));
    } catch (error) {
      req.log.error({ err: error }, "Error updating image label");
      res.status(500).json({ error: "Failed to update label" });
    }
  }
);

router.patch(
  "/projects/:id/cover",
  requireAdminSession,
  requireCsrfHeader,
  async (req: Request, res: Response) => {
    const paramsParsed = ProjectIdParam.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid project id" });
      return;
    }
    const { id } = paramsParsed.data;
    const bodyParsed = SetProjectCoverBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid body: objectPath must be a string or null" });
      return;
    }
    const { objectPath } = bodyParsed.data;
    try {
      const [project] = await db
        .update(projectsTable)
        .set({ coverObjectPath: objectPath })
        .where(eq(projectsTable.id, id))
        .returning();
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(ProjectResponse.parse(project));
    } catch (error) {
      req.log.error({ err: error }, "Error updating project cover");
      res.status(500).json({ error: "Failed to update cover" });
    }
  }
);

export default router;
