import app from "./app";
import { logger } from "./lib/logger";
import { seedDemoData } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  try {
    await seedDemoData();
    logger.info("Demo intelligence dataset is ready");
  } catch (seedError) {
    logger.error({ err: seedError }, "Unable to seed demo intelligence dataset");
    server.close(() => process.exit(1));
  }
});
