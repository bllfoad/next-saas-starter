import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SummaryView() {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Concepts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Introduction to Computer Systems</li>
              <li>Historical Development</li>
              <li>Modern Applications</li>
              <li>Future Trends</li>
            </
ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Important Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Hardware:</strong> Physical components of a computer</p>
              <p><strong>Software:</strong> Programs and data that run on hardware</p>
              <p><strong>Operating System:</strong> Core software that manages hardware and software resources</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

