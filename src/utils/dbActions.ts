import { db } from "../database/db";
import { demoUsers } from "../database/schema";

type demoUserValuesType = {
  name: string;
};

// async function main() {
//   try {
//     await db.insert(demoUsers).values({ name: "John Doe" });
//     const result = await db.select().from(demoUsers);
//     console.log("Successfully queried the database:", result);
//   } catch (error) {
//     console.error("Error querying the database:", error);
//   }
// }

// main();

export const pushDemoUsers = async ( values: demoUserValuesType[] ) => {
  try {
    console.log(typeof values);
    await db.insert(demoUsers).values(values);
    const result = await db.select().from(demoUsers);
    console.log("Successfullt queried the database: ", result);
  } catch (err) {
    console.log("Error querying database: ", err);
  }
};
