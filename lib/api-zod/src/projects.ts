import { z } from "zod";

export const ProjectImageItem = z.object({
  id: z.number(),
  objectPath: z.string(),
  uploadedAt: z.coerce.date().optional(),
  label: z.enum(["before", "after"]).nullable().optional(),
});
export type ProjectImageItem = z.infer<typeof ProjectImageItem>;

export const SetImageLabelBody = z.object({
  label: z.enum(["before", "after"]).nullable(),
});
export type SetImageLabelBody = z.infer<typeof SetImageLabelBody>;

export const ProjectResponse = z.object({
  id: z.number(),
  name: z.string(),
  date: z.string(),
  location: z.string(),
  description: z.string(),
  category: z.string().nullable(),
  coverObjectPath: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type ProjectResponse = z.infer<typeof ProjectResponse>;

export const ProjectWithImagesResponse = ProjectResponse.extend({
  images: z.array(ProjectImageItem),
});
export type ProjectWithImagesResponse = z.infer<typeof ProjectWithImagesResponse>;

export const ListProjectsResponse = z.array(ProjectResponse);
export type ListProjectsResponse = z.infer<typeof ListProjectsResponse>;

export const CreateProjectBody = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  location: z.string().min(1),
  description: z.string().default(""),
  category: z.string().nullable().default(null),
});
export type CreateProjectBody = z.infer<typeof CreateProjectBody>;

export const UpdateProjectBody = z.object({
  name: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().nullable().optional(),
  coverObjectPath: z.string().nullable().optional(),
});
export type UpdateProjectBody = z.infer<typeof UpdateProjectBody>;

export const AddProjectImageBody = z.object({
  objectPath: z.string().min(1),
});
export type AddProjectImageBody = z.infer<typeof AddProjectImageBody>;

export const ProjectIdParam = z.object({
  id: z.coerce.number().int().positive(),
});
export type ProjectIdParam = z.infer<typeof ProjectIdParam>;

export const ProjectImageIdParam = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});
export type ProjectImageIdParam = z.infer<typeof ProjectImageIdParam>;

export const SetProjectCoverBody = z.object({
  objectPath: z.string().nullable(),
});
export type SetProjectCoverBody = z.infer<typeof SetProjectCoverBody>;
