import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function OrganizationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>
          Organization and sharing features are disabled in local-only mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Use local projects and tasks directly from this app.
      </CardContent>
    </Card>
  );
}
