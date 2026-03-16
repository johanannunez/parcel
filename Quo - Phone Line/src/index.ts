import { listPhoneNumbers, listUsers } from "./client.js";

async function main() {
  console.log("Connecting to Quo API...\n");

  const [phoneNumbers, users] = await Promise.all([
    listPhoneNumbers(),
    listUsers({ maxResults: 50 }),
  ]);

  console.log("Phone Numbers:");
  for (const pn of phoneNumbers.data) {
    console.log(`  ${pn.formattedNumber} (${pn.number})  id=${pn.id}  name="${pn.name}"`);
  }

  console.log("\nUsers:");
  for (const user of users.data) {
    console.log(`  ${user.firstName} ${user.lastName}  id=${user.id}  email=${user.email}`);
  }

  console.log("\nConnection verified.");
}

main().catch((err: unknown) => {
  console.error("Error:", err);
  process.exit(1);
});
