import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ChaptersDataTable } from "@/components/chapters-data-table"
import { SectionCards } from "@/components/section-cards"

export default function Page() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <ChaptersDataTable />
    </>
  )
}
