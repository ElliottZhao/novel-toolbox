import { PrismaClient } from "../app/generated/prisma"
const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  console.log(`Seeding finished.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 