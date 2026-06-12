import { processScheduledMessages } from "./scheduledMessages.job";
import { processDisappearingMessages } from "./disappearingMessages.job";
import { logger } from "./logger";

const SCHEDULED_MESSAGES_INTERVAL = 60 * 1000;
const DISAPPEARING_MESSAGES_INTERVAL = 30 * 1000;

export const startJobs = (): void => {
  logger.info("⏰ Starting background jobs...");

  setInterval(async () => {
    await processScheduledMessages();
  }, SCHEDULED_MESSAGES_INTERVAL);

  setInterval(async () => {
    await processDisappearingMessages();
  }, DISAPPEARING_MESSAGES_INTERVAL);

  logger.info("✅ Background jobs started");
};