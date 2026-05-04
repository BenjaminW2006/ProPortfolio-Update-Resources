import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Serve Clerk JS bundle via unpkg.com — npm.clerk.dev is not reachable in this environment.
// This route must be registered BEFORE the generic proxy middleware below.
app.use(
  `${CLERK_PROXY_PATH}/npm`,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.path is relative to the mount point, e.g. "/@clerk/clerk-js@6/dist/clerk.browser.js"
      const npmPath = req.path.startsWith("/") ? req.path.slice(1) : req.path;
      const upstream = await fetch(`https://unpkg.com/${npmPath}`, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!upstream.ok) {
        res.status(upstream.status).end();
        return;
      }
      const body = await upstream.arrayBuffer();
      res.setHeader(
        "Content-Type",
        upstream.headers.get("Content-Type") ?? "application/javascript",
      );
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(body));
    } catch (err) {
      next(err);
    }
  },
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://storage.googleapis.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

const allowedOrigins: string[] = process.env.REPLIT_DOMAINS
  ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`)
  : [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!process.env.REPLIT_DOMAINS && origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
