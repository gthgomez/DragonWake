import { migrate } from "./pg.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(2);
}
try {
  const result = await migrate(url);
  console.log(JSON.stringify(result));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
