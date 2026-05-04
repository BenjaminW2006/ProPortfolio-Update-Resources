import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import session from "express-session";
import { randomBytes } from "crypto";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ── Security headers (Helmet) ─────────────────────────────────────────────────
// Applied before CORS so headers are set on every response including preflight.
app.use(
  helmet({
    // Allow images/media from our own storage origin (Replit Object Storage CDN)
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
    crossOriginEmbedderPolicy: false, // keep off — breaks some image requests
  }),
);

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production: allow only the site's own origin(s) derived from REPLIT_DOMAINS.
// In development: allow localhost on any port.
const allowedOrigins: string[] = (() => {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    return domains.split(",").map((d) => `https://${d.trim()}`);
  }
  // Dev fallback — accept any localhost origin
  return [];
})();

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, server-to-server, same-origin fetches)
      if (!origin) return callback(null, true);
      // Allow localhost in development
      if (!process.env.REPLIT_DOMAINS && origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ── Body size limits ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Session ───────────────────────────────────────────────────────────────────
// Use a dedicated SESSION_SECRET — never reuse ADMIN_PASSWORD.
// Fall back to a random ephemeral value in development only.
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret =
  process.env.SESSION_SECRET ||
  (isProduction
    ? (() => { throw new Error("SESSION_SECRET must be set in production"); })()
    : randomBytes(32).toString("hex"));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // secure: true requires HTTPS — the Replit proxy provides this in production.
      // trust proxy: 1 (set above) ensures Express sees the forwarded protocol correctly.
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  }),
);

app.use("/api", router);

export default app;
