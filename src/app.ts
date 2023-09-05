import logger from "./lib/logging";
import { config } from "dotenv";
import { loadKeys } from "./utils/jwt";

config();

import env from "./constants/env";
import { connectDB } from "./lib/db";
import createServer from "./utils/server";
import cluster from 'cluster';
import os from 'os';

const PORT = env.PORT;

async function main() {

  connectDB()

  if (env.isDev) {

    await loadKeys()
    const { app } = await createServer();

    app.listen(PORT, async () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`);
    })

    process.on('uncaughtException', async (e) => {
      logger.error(JSON.stringify(e));
      setTimeout(() => {
        process.exit(1);
      }, 600);
    });

  } else {
    if (cluster.isPrimary) {
      const totalCPUs = os.cpus().length;

      for (let cpu = 0; cpu < totalCPUs; cpu++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        logger.error(JSON.stringify(`${code} - ${signal}`));
        setTimeout(() => {
          process.exit(1);
        }, 600);
      });
    } else {
      await loadKeys()
      const { app } = await createServer();

            app.listen(PORT, async () => {
                logger.info(`🚀 Server ready at http://localhost:${PORT}`);
            });

            process.on('uncaughtException', async (e) => {
                logger.error(JSON.stringify(e));
                setTimeout(() => {
                    process.exit(1);
                }, 600);
            });
    }
  }

}

main();