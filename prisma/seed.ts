import { PrismaClient } from "../app/generated/prisma"
const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  // Clean up existing data
  await prisma.chapter.deleteMany({})
  await prisma.analysisResult.deleteMany({})
  await prisma.book.deleteMany({})
  console.log("Deleted previous data.")

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