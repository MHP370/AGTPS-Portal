import IranPortalMap from "@/components/portal/IranPortalMap";

type IranNeonMapProps = {
  selectedSiteId?: string | null;
  onSiteSelect?: (siteId: string) => void;
  showApplications?: boolean;
};

export default function IranNeonMap(props: IranNeonMapProps) {
  return <IranPortalMap {...props} />;
}
